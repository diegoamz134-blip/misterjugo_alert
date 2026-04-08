importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDwWnqWcMURMxH5Qc3PY-3Y8ky2bZTTb50",
    authDomain: "misterjugo-d58be.firebaseapp.com",
    projectId: "misterjugo-d58be",
    storageBucket: "misterjugo-d58be.firebasestorage.app",
    messagingSenderId: "320930129162",
    appId: "1:320930129162:web:eaa5db2bfb9d9845e7c6f3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || '¡Alerta MisterJugo!';
    const options = {
        body: payload.notification?.body || 'Hay un pedido esperando.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [400, 150, 400, 150, 700],
        tag: 'kitchen-alert',
        renotify: true,
        requireInteraction: true,
    };
    self.registration.showNotification(title, options);
});
