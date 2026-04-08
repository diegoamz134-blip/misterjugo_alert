import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from './firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
let _msg = null;
const getMsg = () => { if (!_msg) _msg = getMessaging(app); return _msg; };

export const getPermissionStatus = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

export const requestAndRegister = async (role = 'waiter') => {
    try {
        if (!('Notification' in window)) return 'unsupported';
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return 'denied';
        const token = await getToken(getMsg(), { vapidKey: VAPID_KEY });
        if (!token) return 'error';
        const q = query(collection(db, 'devices'), where('token', '==', token));
        const snap = await getDocs(q);
        if (snap.empty) {
            await addDoc(collection(db, 'devices'), {
                token, role, createdAt: Timestamp.now(),
            });
        }
        return 'granted';
    } catch (e) {
        console.warn('FCM error:', e.message);
        return 'error';
    }
};

export const listenForeground = (callback) => {
    try { return onMessage(getMsg(), callback); }
    catch { return () => { }; }
};
