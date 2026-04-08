import { useState, useEffect } from 'react';
import { subscribeToTables } from '../services/firebase';

// ─── Configuración de pisos y mesas ────────────────────────────────────────
export const FLOORS = [
  {
    floor: 1,
    label: 'Piso 1',
    emoji: '🏠',
    tables: Array.from({ length: 7 }, (_, i) => i + 1),       // 1  → 7
  },
  {
    floor: 2,
    label: 'Piso 2',
    emoji: '🏢',
    tables: Array.from({ length: 20 }, (_, i) => i + 8),      // 8  → 27
  },
  {
    floor: 3,
    label: 'Piso 3',
    emoji: '🌇',
    tables: Array.from({ length: 13 }, (_, i) => i + 28),     // 28 → 40
  },
];

const sortByNumber = (arr) =>
  [...arr].sort((a, b) => (a.tableNumber || +a.id) - (b.tableNumber || +b.id));

// ─── Hook principal ─────────────────────────────────────────────────────────
export const useTables = () => {
  const [tables, setTables] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTables((data) => {
      setTables(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getTable = (tableNumber) =>
    tables[String(tableNumber)] || { status: 'idle', tableNumber };

  const all = Object.values(tables);

  /** Mozo acaba de tomar el pedido — esperando que cocina confirme */
  const orderedTables = sortByNumber(all.filter((t) => t.status === 'ordered'));

  /** Cocina confirmó — pedido en preparación */
  const cookingTables = sortByNumber(all.filter((t) => t.status === 'cooking'));

  /** Pedido listo — mozo debe ir a buscar */
  const readyTables = sortByNumber(all.filter((t) => t.status === 'ready'));

  /** Mesas activas (cualquier estado distinto de idle) */
  const activeTables = sortByNumber(all.filter((t) => t.status !== 'idle'));

  const isInitialized = all.length > 0;

  return {
    tables,
    loading,
    getTable,
    orderedTables,
    cookingTables,
    readyTables,
    activeTables,
    isInitialized,
  };
};
