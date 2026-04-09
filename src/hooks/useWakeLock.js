import { useEffect, useRef } from 'react';

/**
 * Hook para mantener la pantalla encendida (WakeLock API)
 * Muy útil para tablets en cocina/jugos que no deben apagarse solas u oscurecerse.
 */
export const useWakeLock = () => {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    // Solo funciona si el navegador lo soporta y estamos en contexto seguro (HTTPS o localhost)
    if (!('wakeLock' in navigator)) {
      console.warn('WakeLock API no soportada en este navegador.');
      return;
    }

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('💡 Pantalla mantenida activa (WakeLock activo)');

        // Si se libera por el sistema (modo ahorro de batería, etc)
        wakeLockRef.current.addEventListener('release', () => {
          console.log('💡 WakeLock liberado por el sistema');
        });
      } catch (err) {
        console.warn(`Error WakeLock: ${err.name}, ${err.message}`);
      }
    };

    // Solicitar al montar
    requestWakeLock();

    // Re-solicitar si la pestaña cambia de visibilidad (ej. si minimizan y vuelven)
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);
};
