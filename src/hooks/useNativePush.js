import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useNativePush = (role, waiterName = null) => {
  useEffect(() => {
    // Solo registrar si estamos en Android/iOS nativo y tenemos un rol definido
    if (!Capacitor.isNativePlatform() || !role) return;

    const setupPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('Permisos de notificaciones denegados.');
          return;
        }

        // Crear Canales de Notificación para Android 8+
        PushNotifications.createChannel({
          id: 'kitchen-alerts',
          name: 'Alertas de Cocina y Jugo',
          description: 'Notificaciones de pedidos nuevos',
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: 'kitchen',
        }).catch(() => {});

        PushNotifications.createChannel({
          id: 'waiter-alerts',
          name: 'Alertas de Mozos',
          description: 'Notificaciones de pedidos listos',
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: 'alert',
        }).catch(() => {});

        // Limpiar listeners anteriores para no duplicarlos
        await PushNotifications.removeAllListeners();

        // Cuando Firebase devuelve el token del dispositivo
        PushNotifications.addListener('registration', async (token) => {
          console.log('Firebase Push Token registrado:', token.value);
          const deviceRef = doc(db, 'devices', token.value);

          // Datos base del dispositivo
          const deviceData = {
            token: token.value,
            role: role,
            updatedAt: serverTimestamp(),
            platform: Capacitor.getPlatform(),
          };

          // Si es mozo, guardar su nombre para poder enviarle FCM personalizado
          // Esto permite que solo el mozo dueño del pedido reciba la alerta
          if (role === 'waiter' && waiterName) {
            deviceData.waiterName = waiterName;
          }

          await setDoc(deviceRef, deviceData, { merge: true });
          console.log('Dispositivo registrado:', { role, waiterName });
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error al registrar dispositivo:', error);
        });

        // Evento: cuando llega una push mientras la app está abierta
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Notificación recibida en primer plano:', notification);
        });

        // Registrarse a Firebase Messaging
        await PushNotifications.register();
      } catch (error) {
        console.error('Error inicializando PushNotifications', error);
      }
    };

    setupPush();

  // Volver a registrar si cambia el nombre del mozo (cambió de nombre en la app)
  }, [role, waiterName]);
};
