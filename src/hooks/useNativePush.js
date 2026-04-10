import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useNativePush = (role) => {
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
        // IMPORTANTE: Android requiere canales para reproducir alertas en Foreground/Background
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

        // 1. Cuando Firestore nos devuelve el Token exitosamente
        PushNotifications.addListener('registration', async (token) => {
          console.log('Firebase Push Token registrado:', token.value);
          // Guardamos en la base de datos de MisterJugo
          const deviceRef = doc(db, 'devices', token.value);
          await setDoc(deviceRef, {
            token: token.value,
            role: role,
            updatedAt: serverTimestamp(),
            platform: Capacitor.getPlatform()
          }, { merge: true });
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error al registrar dispositivo:', error);
        });

        // Evento: cuando llega una push mientras la app está abierta
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Notificación recibida en primer plano:', notification);
        });

        // Finalmente registrarse a Firebase Messaging
        await PushNotifications.register();
      } catch (error) {
        console.error('Error inicializando PushNotifications', error);
      }
    };

    setupPush();

  }, [role]);
};
