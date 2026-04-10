import { useEffect, useRef } from 'react';
import { playAlertSound, vibrateDevice, playKitchenOrderSound, playSoftConfirmSound } from '../services/audio';
import { mostrarNotificacionLocal } from './useLocalNotifications';

const speakAcknowledge = (tableNumber, waiterName, area) => {
  try {
    if (!window.speechSynthesis) return;
    const nameStr = waiterName ? waiterName : 'un mozo';
    const itemStr = area === 'jugo' ? 'los jugos' : 'el pedido';
    const text = `El mozo ${nameStr} ya recogió ${itemStr} de la mesa ${tableNumber}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = navigator.language || 'es';
    utt.rate = 1.05;
    window.speechSynthesis.speak(utt);
  } catch (e) {}
};

/**
 * Hook para la Vista MOZOS
 * - Sonido/vibración fuerte cuando llega "ready" (de cocina O jugo)
 * - Sonido suave cuando cocina/jugo confirma "cooking"
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
        const table = readyTables.find((t) => t.id === id);
        const num = table?.tableNumber || id;
        playAlertSound();
        vibrateDevice();
        mostrarNotificacionLocal(
          `¡Mesa ${num} Lista!`,
          'El pedido está listo para entregar. ¡Vamos!',
          'waiter-alerts'
        );
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
 * Hook combinado para el mozo — recibe alertas de AMBAS áreas
 * Combina las listas de ready y cooking de cocina y jugos
 */
export const useWaiterDualAlerts = (
  readyTablesKitchen, cookingTablesKitchen,
  readyTablesJugo, cookingTablesJugo
) => {
  // Combinar listas con prefijo para que los IDs no colisionen
  const allReady = [
    ...readyTablesKitchen.map((t) => ({ ...t, _alertId: `k_${t.id}` })),
    ...readyTablesJugo.map((t) => ({ ...t, _alertId: `j_${t.id}` })),
  ];
  const allCooking = [
    ...cookingTablesKitchen.map((t) => ({ ...t, _alertId: `k_${t.id}` })),
    ...cookingTablesJugo.map((t) => ({ ...t, _alertId: `j_${t.id}` })),
  ];

  const initializedRef = useRef(false);
  const prevReadyRef = useRef(new Set());
  const prevCookingRef = useRef(new Set());
  const repeatRef = useRef(null);

  useEffect(() => {
    const currentReady = new Set(allReady.map((t) => t._alertId));
    const currentCooking = new Set(allCooking.map((t) => t._alertId));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevReadyRef.current = currentReady;
      prevCookingRef.current = currentCooking;
      return;
    }

    for (const id of currentReady) {
      if (!prevReadyRef.current.has(id)) {
        playAlertSound();
        vibrateDevice();
        break;
      }
    }

    for (const id of currentCooking) {
      if (!prevCookingRef.current.has(id)) {
        playSoftConfirmSound();
        if ('vibrate' in navigator) navigator.vibrate([100]);
        break;
      }
    }

    prevReadyRef.current = currentReady;
    prevCookingRef.current = currentCooking;
  }, [allReady.length, allCooking.length]);

  useEffect(() => {
    if (allReady.length > 0) {
      repeatRef.current = setInterval(() => {
        playAlertSound();
        vibrateDevice();
      }, 25000);
    }
    return () => clearInterval(repeatRef.current);
  }, [allReady.length > 0]);
};

/**
 * Hook para la Vista COCINA
 * - Sonido cuando llega un nuevo pedido del mozo ("ordered")
 * - Voz cuando el mozo recoge la comida (desaparece de "ready")
 */
export const useKitchenAlerts = (orderedTables, readyTables) => {
  const initOrderedRef = useRef(false);
  const prevOrderedRef = useRef(new Set());
  
  const initReadyRef = useRef(false);
  const prevReadyRef = useRef(new Map());

  // 1. Alertas de nuevos pedidos
  useEffect(() => {
    const currentOrdered = new Set(orderedTables.map((t) => t.id));
    if (!initOrderedRef.current) {
      initOrderedRef.current = true;
      prevOrderedRef.current = currentOrdered;
      return;
    }
    for (const id of currentOrdered) {
      if (!prevOrderedRef.current.has(id)) {
        const table = orderedTables.find((t) => t.id === id);
        const num = table?.tableNumber || id;
        playKitchenOrderSound(); // sonido fuerte para cocina ruidosa
        mostrarNotificacionLocal(
          `🍳 Nuevo Pedido · Mesa ${num}`,
          'El mozo registró un pedido nuevo.',
          'kitchen-alerts'
        );
        break;
      }
    }
    prevOrderedRef.current = currentOrdered;
  }, [orderedTables]);

  // 2. Voz cuando el mozo recoge la comida
  useEffect(() => {
    const currentReady = new Map(readyTables.map((t) => [t.id, t]));
    if (!initReadyRef.current) {
      initReadyRef.current = true;
      prevReadyRef.current = currentReady;
      return;
    }
    for (const [id, prevTable] of prevReadyRef.current.entries()) {
      if (!currentReady.has(id)) {
        const num = prevTable.tableNumber || parseInt(prevTable.id);
        speakAcknowledge(num, prevTable.waiterName, 'cocina');
      }
    }
    prevReadyRef.current = currentReady;
  }, [readyTables]);
};

/**
 * Hook para la Vista JUGOS
 * - Mismo patrón que useKitchenAlerts
 */
export const useJugoAlerts = (orderedTablesJugo, readyTablesJugo) => {
  const initOrderedRef = useRef(false);
  const prevOrderedRef = useRef(new Set());
  
  const initReadyRef = useRef(false);
  const prevReadyRef = useRef(new Map());

  useEffect(() => {
    const currentOrdered = new Set(orderedTablesJugo.map((t) => t.id));
    if (!initOrderedRef.current) {
      initOrderedRef.current = true;
      prevOrderedRef.current = currentOrdered;
      return;
    }
    for (const id of currentOrdered) {
      if (!prevOrderedRef.current.has(id)) {
        const table = orderedTablesJugo.find((t) => t.id === id);
        const num = table?.tableNumber || id;
        playKitchenOrderSound();
        mostrarNotificacionLocal(
          `🥤 Nuevo Jugo · Mesa ${num}`,
          'El mozo registró un pedido nuevo.',
          'kitchen-alerts'
        );
        break;
      }
    }
    prevOrderedRef.current = currentOrdered;
  }, [orderedTablesJugo]);

  useEffect(() => {
    const currentReady = new Map(readyTablesJugo.map((t) => [t.id, t]));
    if (!initReadyRef.current) {
      initReadyRef.current = true;
      prevReadyRef.current = currentReady;
      return;
    }
    for (const [id, prevTable] of prevReadyRef.current.entries()) {
      if (!currentReady.has(id)) {
        const num = prevTable.tableNumber || parseInt(prevTable.id);
        speakAcknowledge(num, prevTable.waiterName, 'jugo');
      }
    }
    prevReadyRef.current = currentReady;
  }, [readyTablesJugo]);
};

// Mantener compatibilidad con el hook anterior
export const useAlerts = (readyTables) => {
  useWaiterAlerts(readyTables, []);
};
