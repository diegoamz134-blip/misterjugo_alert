import { useEffect, useRef } from 'react';
import { playAlertSound, vibrateDevice, playKitchenOrderSound, playSoftConfirmSound } from '../services/audio';

// Los sonidos ahora vienen todos de audio.js

/**
 * Hook para la Vista MOZOS
 * - Sonido/vibración fuerte cuando llega "ready"
 * - Sonido suave cuando cocina confirma "cooking"
 */
export const useWaiterAlerts = (readyTables, cookingTables) => {
  const initializedRef = useRef(false);
  const prevReadyRef = useRef(new Set());
  const prevCookingRef = useRef(new Set());
  const repeatRef = useRef(null);

  useEffect(() => {
    const currentReady = new Set(readyTables.map((t) => t.id));
    const currentCooking = new Set(cookingTables.map((t) => t.id));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevReadyRef.current = currentReady;
      prevCookingRef.current = currentCooking;
      return;
    }

    // ¿Nueva mesa lista?
    for (const id of currentReady) {
      if (!prevReadyRef.current.has(id)) {
        playAlertSound();
        vibrateDevice();
        break;
      }
    }

    // ¿Nueva mesa en cocina? (soft notification para el mozo)
    for (const id of currentCooking) {
      if (!prevCookingRef.current.has(id)) {
        playSoftConfirmSound();
        if ('vibrate' in navigator) navigator.vibrate([100]);
        break;
      }
    }

    prevReadyRef.current = currentReady;
    prevCookingRef.current = currentCooking;
  }, [readyTables, cookingTables]);

  // Repetir alerta de "ready" cada 25s si sigue sin atender
  useEffect(() => {
    if (readyTables.length > 0) {
      repeatRef.current = setInterval(() => {
        playAlertSound();
        vibrateDevice();
      }, 25000);
    }
    return () => clearInterval(repeatRef.current);
  }, [readyTables.length > 0]);
};

/**
 * Hook para la Vista COCINA
 * - Sonido cuando llega un nuevo pedido del mozo ("ordered")
 */
export const useKitchenAlerts = (orderedTables) => {
  const initializedRef = useRef(false);
  const prevOrderedRef = useRef(new Set());

  useEffect(() => {
    const currentOrdered = new Set(orderedTables.map((t) => t.id));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevOrderedRef.current = currentOrdered;
      return;
    }

    for (const id of currentOrdered) {
      if (!prevOrderedRef.current.has(id)) {
        playKitchenOrderSound(); // sonido fuerte para cocina ruidosa
        break;
      }
    }

    prevOrderedRef.current = currentOrdered;
  }, [orderedTables]);
};

// Mantener compatibilidad con el hook anterior
export const useAlerts = (readyTables) => {
  useWaiterAlerts(readyTables, []);
};
