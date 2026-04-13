import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────────
//  FLUJO POR ÁREA:
//  idle → [mozo] → ordered → [cocina/jugo] → cooking → [cocina/jugo] → ready
//                                                                    → [mozo] → idle
//
//  Cada mesa tiene: status_cocina y status_jugo (independientes)
// ─────────────────────────────────────────────────────────────────

/** Llama a la API de Vercel para enviar la notificación Push */
const triggerNotification = async (tableNumber, status, area = '') => {
  try {
    // Evitar el error 404 en la consola durante desarrollo local
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return; 
    }

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, status, area })
    }).catch(() => {}); // Ocultar errores si falla
  } catch (e) {}
};

// ═══════════════════════════════════════════════════════════════
//  FUNCIONES POR ÁREA (NUEVO SISTEMA)
// ═══════════════════════════════════════════════════════════════

/** MOZO: Registra pedido para un área específica */
export const markTableOrderedForArea = async (tableNumber, area, waiterName = '') => {
  const ref = doc(db, 'tables', String(tableNumber));
  const now = Timestamp.now();

  if (area === 'ambos') {
    await updateDoc(ref, {
      status_cocina: 'ordered',
      status_jugo: 'ordered',
      orderedAt_cocina: now,
      orderedAt_jugo: now,
      cookingAt_cocina: null,
      cookingAt_jugo: null,
      readyAt_cocina: null,
      readyAt_jugo: null,
      paseCount_cocina: 0,
      paseCount_jugo: 0,
      paseAt_cocina: null,
      paseAt_jugo: null,
      waiterName: waiterName || '',
      // Legacy
      status: 'ordered',
      orderedAt: now,
    });
    triggerNotification(tableNumber, 'ordered', 'ambos');
  } else if (area === 'cocina') {
    await updateDoc(ref, {
      status_cocina: 'ordered',
      orderedAt_cocina: now,
      cookingAt_cocina: null,
      readyAt_cocina: null,
      paseCount_cocina: 0,
      paseAt_cocina: null,
      waiterName: waiterName || '',
      // Legacy
      status: 'ordered',
      orderedAt: now,
    });
    triggerNotification(tableNumber, 'ordered', 'cocina');
  } else if (area === 'jugo') {
    await updateDoc(ref, {
      status_jugo: 'ordered',
      orderedAt_jugo: now,
      cookingAt_jugo: null,
      readyAt_jugo: null,
      paseCount_jugo: 0,
      paseAt_jugo: null,
      waiterName: waiterName || '',
      // Legacy (solo si cocina está idle)
      status: 'ordered',
      orderedAt: now,
    });
    triggerNotification(tableNumber, 'ordered', 'jugo');
  }
};

/** COCINA/JUGO: Confirma que recibió el pedido y está preparando */
export const confirmCookingForArea = async (tableNumber, area) => {
  const ref = doc(db, 'tables', String(tableNumber));
  const field = area === 'jugo' ? 'status_jugo' : 'status_cocina';
  const cookingField = area === 'jugo' ? 'cookingAt_jugo' : 'cookingAt_cocina';
  await updateDoc(ref, {
    [field]: 'cooking',
    [cookingField]: Timestamp.now(),
  });
};

/** COCINA/JUGO: El pedido está listo para entregar */
export const markReadyForArea = async (tableNumber, area) => {
  const ref = doc(db, 'tables', String(tableNumber));
  const field = area === 'jugo' ? 'status_jugo' : 'status_cocina';
  const readyField = area === 'jugo' ? 'readyAt_jugo' : 'readyAt_cocina';
  await updateDoc(ref, {
    [field]: 'ready',
    [readyField]: Timestamp.now(),
  });
  triggerNotification(tableNumber, 'ready', area);
};

/** COCINA/JUGO: Pase parcial — hay platos listos pero falta más */
export const markPaseForArea = async (tableNumber, area) => {
  const ref = doc(db, 'tables', String(tableNumber));
  const field = area === 'jugo' ? 'status_jugo' : 'status_cocina';
  const paseCountField = area === 'jugo' ? 'paseCount_jugo' : 'paseCount_cocina';
  const paseAtField = area === 'jugo' ? 'paseAt_jugo' : 'paseAt_cocina';
  await updateDoc(ref, {
    [field]: 'pase',
    [paseAtField]: Timestamp.now(),
    [paseCountField]: increment(1),
  });
  triggerNotification(tableNumber, 'pase', area);
};

/** MOZO: Confirma que recogió el pase parcial → vuelve a cooking */
export const acknowledgePaseForArea = async (tableNumber, area) => {
  const ref = doc(db, 'tables', String(tableNumber));
  const field = area === 'jugo' ? 'status_jugo' : 'status_cocina';
  await updateDoc(ref, {
    [field]: 'cooking',
  });
};

/** MOZO: Confirma que recogió el pedido de un área → esa área vuelve a idle */
export const acknowledgeForArea = async (tableNumber, area) => {
  const ref = doc(db, 'tables', String(tableNumber));
  const field = area === 'jugo' ? 'status_jugo' : 'status_cocina';
  const areaKey = area === 'jugo' ? 'jugo' : 'cocina';
  await updateDoc(ref, {
    [field]: 'idle',
    [`orderedAt_${areaKey}`]: null,
    [`cookingAt_${areaKey}`]: null,
    [`readyAt_${areaKey}`]: null,
    [`paseCount_${areaKey}`]: 0,
    [`paseAt_${areaKey}`]: null,
  });
};

/** Cancela el pedido de un área específica */
export const resetTableForArea = async (tableNumber, area) => {
  const ref = doc(db, 'tables', String(tableNumber));
  const field = area === 'jugo' ? 'status_jugo' : 'status_cocina';
  const areaKey = area === 'jugo' ? 'jugo' : 'cocina';
  await updateDoc(ref, {
    [field]: 'idle',
    [`orderedAt_${areaKey}`]: null,
    [`cookingAt_${areaKey}`]: null,
    [`readyAt_${areaKey}`]: null,
    [`paseCount_${areaKey}`]: 0,
    [`paseAt_${areaKey}`]: null,
  });
};

/** Primera vez: crea los 40 documentos de mesas en Firestore */
export const initializeTables = async () => {
  const batch = writeBatch(db);
  for (let i = 1; i <= 40; i++) {
    const ref = doc(db, 'tables', String(i));
    batch.set(
      ref,
      {
        tableNumber: i,
        status: 'idle',
        orderedAt: null,
        cookingAt: null,
        readyAt: null,
        acknowledgedAt: null,
        // Nuevos campos para doble estado
        status_cocina: 'idle',
        status_jugo: 'idle',
        orderedAt_cocina: null,
        orderedAt_jugo: null,
        cookingAt_cocina: null,
        cookingAt_jugo: null,
        readyAt_cocina: null,
        readyAt_jugo: null,
        paseCount_cocina: 0,
        paseCount_jugo: 0,
        paseAt_cocina: null,
        paseAt_jugo: null,
      },
      { merge: true }
    );
  }
  await batch.commit();
};

/** Suscripción en tiempo real a todas las mesas */
export const subscribeToTables = (callback) => {
  const tablesRef = collection(db, 'tables');
  return onSnapshot(tablesRef, (snapshot) => {
    const tables = {};
    snapshot.forEach((doc) => {
      tables[doc.id] = { id: doc.id, ...doc.data() };
    });
    callback(tables);
  });
};
