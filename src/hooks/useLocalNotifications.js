import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let notifIdCounter = 1;
let permissionsRequested = false;

/**
 * Pide permisos de notificaciones locales al iniciar (solo nativo Android/iOS).
 * Las notificaciones locales son 100% confiables: no dependen de FCM,
 * no tienen delay, funcionan en background si la app está viva.
 */
async function solicitarPermisos() {
  if (!Capacitor.isNativePlatform() || permissionsRequested) return;
  permissionsRequested = true;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // Crear canales de alerta en Android 8+
    await LocalNotifications.createChannel({
      id: 'kitchen-alerts',
      name: 'Alertas de Cocina y Jugo',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'kitchen',
      lights: true,
      lightColor: '#FF6600',
    }).catch(() => {});

    await LocalNotifications.createChannel({
      id: 'waiter-alerts',
      name: 'Alertas de Mozos',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'alert',
      lights: true,
      lightColor: '#FF6600',
    }).catch(() => {});

  } catch (e) {
    console.warn('LocalNotifications no disponible:', e.message);
  }
}

/**
 * Muestra una notificación en la bandeja del sistema.
 * @param {string} title - Título de la notificación
 * @param {string} body  - Cuerpo del mensaje
 * @param {'kitchen-alerts'|'waiter-alerts'} channelId - Canal de Android
 */
export async function mostrarNotificacionLocal(title, body, channelId = 'kitchen-alerts') {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifIdCounter++,
          title,
          body,
          channelId,
          // Mostrar inmediatamente
          schedule: { at: new Date(Date.now() + 100) },
          // Visible en pantalla de bloqueo
          visibility: 1,
          // Sonido y vibración
          sound: channelId === 'waiter-alerts' ? 'alert' : 'kitchen',
          // Abrir la app al tocar la notificación
          actionTypeId: '',
          extra: { channelId },
        },
      ],
    });
    console.log('📲 Notificación local enviada:', title);
  } catch (e) {
    console.warn('Error enviando notificación local:', e.message);
  }
}

/**
 * Hook que inicializa los permisos de notificaciones locales.
 * Úsalo una vez en el componente raíz de la app.
 */
export function useLocalNotifications() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      solicitarPermisos();
    }
  }, []);
}
