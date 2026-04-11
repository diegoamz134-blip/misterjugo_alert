import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Inicializa Firebase Admin solo una vez
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tableNumber, status, area } = req.body;

  // Determinar a quién notificar y el mensaje según estado y área
  let title, body, role;

  if (status === 'ready') {
    // Buscar el nombre del mozo dueño del pedido en Firestore
    let tableWaiterName = null;
    try {
      const tableDoc = await db.collection('tables').doc(String(tableNumber)).get();
      tableWaiterName = tableDoc.exists ? (tableDoc.data().waiterName || null) : null;
    } catch (e) {
      console.warn('No se pudo leer la mesa para obtener waiterName:', e.message);
    }

    // Notificación al MOZO: solo al dueño del pedido
    const areaLabel = area === 'jugo' ? '🥤 Jugos' : area === 'cocina' ? '🍳 Cocina' : '🍳 Cocina y 🥤 Jugos';
    const msgTitle = `${areaLabel} Lista · Mesa ${tableNumber}`;
    const msgBody  = '¡El pedido está listo para entregar! Toca para ir a buscarlo.';

    // Construir query: si tenemos el nombre, filtrar solo ese mozo
    // Si no, enviar a todos los mozos como fallback
    let devicesRef = db.collection('devices').where('role', '==', 'waiter');
    if (tableWaiterName) {
      devicesRef = devicesRef.where('waiterName', '==', tableWaiterName);
      console.log(`Notificando solo a mozo: "${tableWaiterName}" (Mesa ${tableNumber})`);
    } else {
      console.log('waiterName no encontrado, notificando a todos los mozos');
    }

    try {
      const snap = await devicesRef.get();
      if (snap.empty) {
        return res.status(200).json({ ok: true, noDevices: true, waiter: tableWaiterName });
      }

      const messages = snap.docs.map((doc) => ({
        token: doc.data().token,
        data: { title: msgTitle, body: msgBody, role: 'waiter', tableNumber: String(tableNumber) },
        android: { priority: 'high', ttl: 0 },
      }));

      const result = await getMessaging().sendEach(messages);

      const invalidDocs = snap.docs.filter((_, i) => !result.responses[i]?.success);
      if (invalidDocs.length > 0) {
        const batch = db.batch();
        invalidDocs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      return res.status(200).json({
        ok: true, sent: result.successCount, failed: result.failureCount, waiter: tableWaiterName,
      });
    } catch (error) {
      console.error('Notify ready error:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }
  } else if (status === 'ordered') {
    // Notificación a COCINA o JUGOS: nuevo pedido del mozo
    const areaLabel = area === 'jugo' ? '🥤 Nuevo Jugo' : '🍳 Nuevo Pedido';
    title = `${areaLabel} · Mesa ${tableNumber}`;
    body  = 'El mozo registró un pedido nuevo. Confirma cuando empieces.';
    role  = area === 'jugo' ? 'jugo' : 'kitchen';
  } else {
    // Para otros estados no enviamos notificación
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    // Para 'ambos', notificamos a cocina Y jugos en paralelo
    const roles = (area === 'ambos' && status === 'ordered')
      ? ['kitchen', 'jugo']
      : [role];

    let totalSent = 0;
    let totalFailed = 0;

    for (const targetRole of roles) {
      // Adaptar título para el rol específico si es 'ambos'
      let msgTitle = title;
      if (area === 'ambos' && status === 'ordered') {
        msgTitle = targetRole === 'jugo'
          ? `🥤 Nuevo Jugo · Mesa ${tableNumber}`
          : `🍳 Nuevo Pedido · Mesa ${tableNumber}`;
      }

      // Leer tokens del rol correspondiente en Firestore
      const snap = await db
        .collection('devices')
        .where('role', '==', targetRole)
        .get();

      if (snap.empty) continue;

      // Construir los mensajes FCM — SOLO DATA PAYLOAD (sin notification block)
      // CRÍTICO: Si incluyes "notification", Android en background lo intercepta
      // y NO llama a onMessageReceived(). Así perdemos el control de la pantalla.
      // Con solo "data", siempre se llama onMessageReceived() sin importar el estado.
      const messages = snap.docs.map((doc) => ({
        token: doc.data().token,
        // 🔑 SIN bloque "notification" — nuestro MisterJugoFCMService.java lo crea
        data: {
          title: msgTitle,
          body,
          role: targetRole,
          tableNumber: String(tableNumber),
        },
        android: {
          // high = despierta el dispositivo aunque esté dormido/bloqueado
          priority: 'high',
          ttl: 0,
        },
      }));

      const result = await getMessaging().sendEach(messages);
      totalSent   += result.successCount;
      totalFailed += result.failureCount;

      // Limpiar tokens inválidos para mantener la colección limpia
      const invalidDocs = snap.docs.filter(
        (_, i) => !result.responses[i]?.success
      );
      if (invalidDocs.length > 0) {
        const batch = db.batch();
        invalidDocs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    return res.status(200).json({
      ok: true,
      sent: totalSent,
      failed: totalFailed,
    });
  } catch (error) {
    console.error('Notify error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
