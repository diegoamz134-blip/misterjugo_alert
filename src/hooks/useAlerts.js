import { useEffect, useRef } from 'react';
import { playAlertSound, vibrateDevice, playKitchenOrderSound, playSoftConfirmSound, playPaseSound } from '../services/audio';
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
  readyTablesJugo, cookingTablesJugo,
  waiterName = null,
  paseTablesKitchen = [], paseTablesJugo = []
) => {
  const perteneceAlMozo = (t) => {
    if (!waiterName) return true;
    if (!t.waiterName) return true;
    return t.waiterName === waiterName;
  };

  const allReady = [
    ...readyTablesKitchen.filter(perteneceAlMozo).map((t) => ({ ...t, _alertId: `k_${t.id}`, _area: 'cocina' })),
    ...readyTablesJugo.filter(perteneceAlMozo).map((t) => ({ ...t, _alertId: `j_${t.id}`, _area: 'jugo' })),
  ];
  const allCooking = [
    ...cookingTablesKitchen.filter(perteneceAlMozo).map((t) => ({ ...t, _alertId: `k_${t.id}` })),
    ...cookingTablesJugo.filter(perteneceAlMozo).map((t) => ({ ...t, _alertId: `j_${t.id}` })),
  ];
  const allPase = [
    ...paseTablesKitchen.filter(perteneceAlMozo).map((t) => ({ ...t, _alertId: `pk_${t.id}`, _area: 'cocina' })),
    ...paseTablesJugo.filter(perteneceAlMozo).map((t) => ({ ...t, _alertId: `pj_${t.id}`, _area: 'jugo' })),
  ];

  const initializedRef = useRef(false);
  const prevReadyRef = useRef(new Set());
  const prevCookingRef = useRef(new Set());
  const prevPaseRef = useRef(new Set());
  const repeatRef = useRef(null);

  const readyKey = allReady.map((t) => t._alertId).sort().join(',');
  const cookingKey = allCooking.map((t) => t._alertId).sort().join(',');
  const paseKey = allPase.map((t) => t._alertId).sort().join(',');

  useEffect(() => {
    const currentReady = new Set(allReady.map((t) => t._alertId));
    const currentCooking = new Set(allCooking.map((t) => t._alertId));
    const currentPase = new Set(allPase.map((t) => t._alertId));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevReadyRef.current = currentReady;
      prevCookingRef.current = currentCooking;
      prevPaseRef.current = currentPase;
      return;
    }

    // ¿Nueva mesa lista? → Sonido FUERTE + vibración + notificación
    for (const id of currentReady) {
      if (!prevReadyRef.current.has(id)) {
        const table = allReady.find((t) => t._alertId === id);
        const num = table?.tableNumber || table?.id;
        const area = table?._area || 'cocina';
        const areaLabel = area === 'jugo' ? '🥤 Jugo' : '🍳 Cocina';
        playAlertSound();
        vibrateDevice();
        mostrarNotificacionLocal(
          `${areaLabel} Lista · Mesa ${num}`,
          '¡Todo listo! Último viaje. Toca para abrir.',
          'waiter-alerts'
        );
        break;
      }
    }

    // ¿Nuevo pase parcial? → Sonido MEDIO + vibración media + notificación
    for (const id of currentPase) {
      if (!prevPaseRef.current.has(id)) {
        const table = allPase.find((t) => t._alertId === id);
        const num = table?.tableNumber || table?.id;
        const area = table?._area || 'cocina';
        const areaLabel = area === 'jugo' ? '🥤 Jugo' : '🍳 Cocina';
        playPaseSound();
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
        mostrarNotificacionLocal(
          `${areaLabel} Pase · Mesa ${num}`,
          'Hay platos listos pero falta más. ¡Ve a recoger!',
          'waiter-alerts'
        );
        break;
      }
    }

    // ¿Nueva confirmación de cocina/jugo? → sonido suave al mozo
    for (const id of currentCooking) {
      if (!prevCookingRef.current.has(id)) {
        playSoftConfirmSound();
        if ('vibrate' in navigator) navigator.vibrate([100]);
        break;
      }
    }

    prevReadyRef.current = currentReady;
    prevCookingRef.current = currentCooking;
    prevPaseRef.current = currentPase;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyKey, cookingKey, paseKey]);

  useEffect(() => {
    if (allReady.length > 0 || allPase.length > 0) {
      repeatRef.current = setInterval(() => {
        if (allReady.length > 0) {
          playAlertSound();
          vibrateDevice();
          const firstReady = allReady[0];
          if (firstReady) {
            const num = firstReady.tableNumber || firstReady.id;
            const areaLabel = firstReady._area === 'jugo' ? '🥤 Jugo' : '🍳 Cocina';
            mostrarNotificacionLocal(
              `${areaLabel} · Mesa ${num} — Sin atender`,
              '¡El pedido sigue esperando! Por favor recógelo.',
              'waiter-alerts'
            );
          }
        } else if (allPase.length > 0) {
          playPaseSound();
          if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
          const firstPase = allPase[0];
          if (firstPase) {
            const num = firstPase.tableNumber || firstPase.id;
            const areaLabel = firstPase._area === 'jugo' ? '🥤 Jugo' : '🍳 Cocina';
            mostrarNotificacionLocal(
              `${areaLabel} Pase · Mesa ${num} — Sin recoger`,
              'Hay platos listos esperando. ¡Ve a recoger!',
              'waiter-alerts'
            );
          }
        }
      }, 10000);
    }
    return () => clearInterval(repeatRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReady.length > 0 || allPase.length > 0]);
};

/**
 * Hook para la Vista COCINA
 * - Sonido cuando llega un nuevo pedido del mozo ("ordered")
 * - Voz cuando el mozo recoge la comida (desaparece de "ready")
 */
export const useKitchenAlerts = (orderedTables, readyTables) => {
  const initOrderedRef = useRef(false);
  const prevOrderedRef = useRef(new Set());
  const repeatOrderedRef = useRef(null);
  
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
        playKitchenOrderSound();
        vibrateDevice();
        mostrarNotificacionLocal(
          `🍳 Nuevo Pedido · Mesa ${num}`,
          'El mozo registró un pedido nuevo. ¡Confirma!',
          'kitchen-alerts'
        );
        break;
      }
    }
    prevOrderedRef.current = currentOrdered;
  }, [orderedTables]);

  // 2. Repetir alerta cada 10s mientras haya pedidos sin confirmar
  useEffect(() => {
    if (orderedTables.length > 0) {
      repeatOrderedRef.current = setInterval(() => {
        playKitchenOrderSound();
        vibrateDevice();
        const first = orderedTables[0];
        if (first) {
          const num = first.tableNumber || parseInt(first.id);
          mostrarNotificacionLocal(
            `🍳 Mesa ${num} — Pedido sin confirmar`,
            `${orderedTables.length} pedido(s) esperando. ¡Toca para confirmar!`,
            'kitchen-alerts'
          );
        }
      }, 10000);
    }
    return () => clearInterval(repeatOrderedRef.current);
  }, [orderedTables.length > 0]);

  // 3. Voz cuando el mozo recoge la comida
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
  const repeatOrderedRef = useRef(null);
  
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
        vibrateDevice();
        mostrarNotificacionLocal(
          `🥤 Nuevo Jugo · Mesa ${num}`,
          'El mozo registró un pedido de jugo. ¡Confirma!',
          'kitchen-alerts'
        );
        break;
      }
    }
    prevOrderedRef.current = currentOrdered;
  }, [orderedTablesJugo]);

  // Repetir alerta cada 10s mientras haya jugos sin confirmar
  useEffect(() => {
    if (orderedTablesJugo.length > 0) {
      repeatOrderedRef.current = setInterval(() => {
        playKitchenOrderSound();
        vibrateDevice();
        const first = orderedTablesJugo[0];
        if (first) {
          const num = first.tableNumber || parseInt(first.id);
          mostrarNotificacionLocal(
            `🥤 Mesa ${num} — Jugo sin confirmar`,
            `${orderedTablesJugo.length} jugo(s) esperando. ¡Toca para confirmar!`,
            'kitchen-alerts'
          );
        }
      }, 10000);
    }
    return () => clearInterval(repeatOrderedRef.current);
  }, [orderedTablesJugo.length > 0]);

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
