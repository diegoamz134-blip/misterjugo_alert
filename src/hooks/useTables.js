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

  const getTable = (tableNumber) => {
    const t = tables[String(tableNumber)] || { status: 'idle', tableNumber };
    // Fallback: si no tiene los nuevos campos, usar el campo legacy
    return {
      ...t,
      status_cocina: t.status_cocina || (t.status !== 'idle' ? t.status : 'idle'),
      status_jugo: t.status_jugo || 'idle',
    };
  };

  const all = Object.values(tables).map((t) => ({
    ...t,
    status_cocina: t.status_cocina || (t.status !== 'idle' ? t.status : 'idle'),
    status_jugo: t.status_jugo || 'idle',
  }));

  // ── Filtros LEGACY (compatibilidad) ──
  const orderedTables = sortByNumber(all.filter((t) => t.status === 'ordered'));
  const cookingTables = sortByNumber(all.filter((t) => t.status === 'cooking'));
  const readyTables   = sortByNumber(all.filter((t) => t.status === 'ready'));
  const activeTables  = sortByNumber(all.filter((t) => t.status !== 'idle'));

  // ── Filtros COCINA ──
  const orderedTablesKitchen = sortByNumber(all.filter((t) => t.status_cocina === 'ordered'));
  const cookingTablesKitchen = sortByNumber(all.filter((t) => t.status_cocina === 'cooking'));
  const readyTablesKitchen   = sortByNumber(all.filter((t) => t.status_cocina === 'ready'));

  // ── Filtros JUGO ──
  const orderedTablesJugo = sortByNumber(all.filter((t) => t.status_jugo === 'ordered'));
  const cookingTablesJugo = sortByNumber(all.filter((t) => t.status_jugo === 'cooking'));
  const readyTablesJugo   = sortByNumber(all.filter((t) => t.status_jugo === 'ready'));

  // ── Filtros PASE ──
  const paseTablesKitchen = sortByNumber(all.filter((t) => t.status_cocina === 'pase'));
  const paseTablesJugo    = sortByNumber(all.filter((t) => t.status_jugo === 'pase'));

  const isInitialized = all.length > 0;

  return {
    tables,
    loading,
    getTable,
    // Legacy
    orderedTables,
    cookingTables,
    readyTables,
    activeTables,
    // Cocina
    orderedTablesKitchen,
    cookingTablesKitchen,
    readyTablesKitchen,
    // Jugo
    orderedTablesJugo,
    cookingTablesJugo,
    readyTablesJugo,
    // Pase
    paseTablesKitchen,
    paseTablesJugo,
    isInitialized,
  };
};
