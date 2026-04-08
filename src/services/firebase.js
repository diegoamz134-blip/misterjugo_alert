import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  Timestamp,
  writeBatch,
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
//  FLUJO COMPLETO:
//  idle → [mozo] → ordered → [cocina] → cooking → [cocina] → ready
//                                                           → [mozo] → idle
// ─────────────────────────────────────────────────────────────────

/** Llama a la API de Vercel para enviar la notificación Push */
const triggerNotification = async (tableNumber, status) => {
  try {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, status })
    }).catch((e) => console.warn('Notif API err (esperado en local dev):', e));
  } catch (e) {}
};

/** MOZO: Mesa tiene pedido (acaba de tomar la comanda) */
export const markTableOrdered = async (tableNumber) => {
  const ref = doc(db, 'tables', String(tableNumber));
  await updateDoc(ref, {
    status: 'ordered',
    orderedAt: Timestamp.now(),
    cookingAt: null,
    readyAt: null,
    acknowledgedAt: null,
  });
  triggerNotification(tableNumber, 'ordered');
};

/** COCINA: Confirma que recibió el pedido y está cocinando */
export const confirmCooking = async (tableNumber) => {
  const ref = doc(db, 'tables', String(tableNumber));
  await updateDoc(ref, {
    status: 'cooking',
    cookingAt: Timestamp.now(),
  });
};

/** COCINA: El pedido está listo para entregar */
export const markTableReady = async (tableNumber) => {
  const ref = doc(db, 'tables', String(tableNumber));
  await updateDoc(ref, {
    status: 'ready',
    readyAt: Timestamp.now(),
  });
  triggerNotification(tableNumber, 'ready');
};

/** MOZO: Confirma que va a buscar el pedido → mesa vuelve a libre */
export const acknowledgeTable = async (tableNumber) => {
  const ref = doc(db, 'tables', String(tableNumber));
  await updateDoc(ref, {
    status: 'idle',
    orderedAt: null,
    cookingAt: null,
    readyAt: null,
    acknowledgedAt: Timestamp.now(),
  });
};

/** Cancela cualquier estado y vuelve a libre (cocinero o mozo) */
export const resetTable = async (tableNumber) => {
  const ref = doc(db, 'tables', String(tableNumber));
  await updateDoc(ref, {
    status: 'idle',
    orderedAt: null,
    cookingAt: null,
    readyAt: null,
    acknowledgedAt: null,
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
