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

  const { tableNumber, status } = req.body;

  // Determinar a quién notificar y el mensaje
  let title, body, role;

  if (status === 'ready') {
    title = `¡Mesa ${tableNumber} Lista!`;
    body = 'El pedido está listo para entregar. ¡Vamos!';
    role = 'waiter';
  } else if (status === 'ordered') {
    title = `Nuevo Pedido · Mesa ${tableNumber}`;
    body = 'El mozo registró un pedido nuevo. Confirma cuando empieces.';
    role = 'kitchen';
  } else {
    // Para otros estados no enviamos notificación
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    // Leer tokens del rol correspondiente en Firestore
    const snap = await db
      .collection('devices')
      .where('role', '==', role)
      .get();

    if (snap.empty) {
      return res.status(200).json({ ok: true, noDevices: true });
    }

    // Construir los mensajes FCM
    const messages = snap.docs.map((doc) => ({
      token: doc.data().token,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          requireInteraction: true,
          tag: `table-alert-${tableNumber}`,
          renotify: true,
          vibrate: [400, 150, 400, 150, 700],
        },
        fcm_options: { link: '/' },
      },
      android: {
        priority: 'high',
        ttl: 0,
        notification: {
          sound: role === 'waiter' ? 'alert' : 'kitchen',
          channelId: role === 'waiter' ? 'waiter-alerts' : 'kitchen-alerts',
          visibility: 'public',
        },
      },
    }));

    // Enviar a todos los dispositivos
    const result = await getMessaging().sendEach(messages);

    // Limpiar tokens inválidos para mantener la colección limpia
    const invalidDocs = snap.docs.filter(
      (_, i) => !result.responses[i]?.success
    );
    if (invalidDocs.length > 0) {
      const batch = db.batch();
      invalidDocs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    return res.status(200).json({
      ok: true,
      sent: result.successCount,
      failed: result.failureCount,
    });
  } catch (error) {
    console.error('Notify error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
