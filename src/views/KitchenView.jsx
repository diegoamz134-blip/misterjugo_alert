import { useState } from 'react';
import { Zap, Flame, LayoutGrid, Home, Building2, Landmark, Settings, Bell, CheckCircle2, X } from 'lucide-react';
import { useTables, FLOORS } from '../hooks/useTables';
import { confirmCookingForArea, markReadyForArea, markPaseForArea, resetTableForArea, initializeTables } from '../services/firebase';
import { useKitchenAlerts } from '../hooks/useAlerts';
import { useWakeLock } from '../hooks/useWakeLock';
import TableCard from '../components/TableCard';
import VoiceFAB from '../components/VoiceFAB';
import logo from '../assets/misterjugo.jpg';

const FloorIcon = ({ floor, size = 16 }) => {
  if (floor === 1) return <Home size={size} />;
  if (floor === 2) return <Building2 size={size} />;
  return <Landmark size={size} />;
};

export default function KitchenView({ onChangeMode }) {
  const { loading, getTable, orderedTablesKitchen, cookingTablesKitchen, readyTablesKitchen, isInitialized } = useTables();
  const [initializing, setInitializing] = useState(false);
  const [activeFloor, setActiveFloor] = useState(null);
  const [cookingModalTable, setCookingModalTable] = useState(null);

  useWakeLock();
  useKitchenAlerts(orderedTablesKitchen, readyTablesKitchen);

  const handleTableClick = (tableNumber) => {
    const table = getTable(tableNumber);
    switch (table.status_cocina) {
      case 'ordered': confirmCookingForArea(tableNumber, 'cocina'); break;
      case 'cooking': setCookingModalTable(tableNumber); break;
      case 'pase':    markReadyForArea(tableNumber, 'cocina'); break;
      case 'ready':   resetTableForArea(tableNumber, 'cocina'); break;
      default: break;
    }
  };

  const handleInitialize = async () => {
    setInitializing(true);
    try { await initializeTables(); }
    finally { setInitializing(false); }
  };

  const floorsToShow = activeFloor ? FLOORS.filter((f) => f.floor === activeFloor) : FLOORS;
  const pendingCount = orderedTablesKitchen.length;
  const cookingCount = cookingTablesKitchen.length;
  const readyCount   = readyTablesKitchen.length;

  return (
    <div className="min-h-screen bg-[#080d1a]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-[#080d1a]/95 backdrop-blur border-b border-slate-800/60 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white overflow-hidden rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 border border-slate-700">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-base leading-tight">Vista Cocina</h1>
              <p className="text-xs text-slate-500 leading-tight">
                {pendingCount > 0 && <span className="text-blue-400">{pendingCount} nuevo{pendingCount > 1 ? 's' : ''} · </span>}
                {cookingCount > 0 && <span className="text-amber-400">{cookingCount} cocinando · </span>}
                {readyCount > 0   && <span className="text-orange-400">{readyCount} listo{readyCount > 1 ? 's' : ''}</span>}
                {pendingCount === 0 && cookingCount === 0 && readyCount === 0 && 'Todo en orden'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isInitialized && !loading && (
              <button onClick={handleInitialize} disabled={initializing}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1">
                <Zap size={12} /> {initializing ? 'Iniciando...' : 'Inicializar'}
              </button>
            )}
            <button onClick={onChangeMode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl transition-all border border-slate-700 flex items-center gap-1">
              <Settings size={12} /> Vista
            </button>
          </div>
        </div>
      </header>

      {/* ── Banner nuevos pedidos ── */}
      {pendingCount > 0 && (
        <div className="px-4 mt-3 max-w-4xl mx-auto">
          <div className="bg-blue-600/20 border border-blue-500/40 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Zap size={22} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-blue-300 font-bold text-sm">
                {pendingCount} pedido{pendingCount > 1 ? 's' : ''} nuevo{pendingCount > 1 ? 's' : ''} esperando confirmación
              </p>
              <p className="text-blue-400/70 text-xs">Toca las mesas azules para confirmar</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs de pisos ── */}
      <div className="flex gap-2 px-4 pt-3 pb-2 max-w-4xl mx-auto overflow-x-auto">
        <button onClick={() => setActiveFloor(null)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeFloor === null ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          <LayoutGrid size={14} /> Todos
        </button>
        {FLOORS.map((f) => (
          <button key={f.floor} onClick={() => setActiveFloor(f.floor === activeFloor ? null : f.floor)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeFloor === f.floor ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            <FloorIcon floor={f.floor} size={14} /> {f.label}
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <main className="px-4 pb-8 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Conectando con Firebase...</p>
          </div>
        ) : !isInitialized ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <Settings size={48} className="text-slate-600" />
            <h2 className="text-white font-bold text-xl">Primera vez</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Presiona <strong className="text-blue-400">Inicializar</strong> arriba para crear las 40 mesas en Firestore.
            </p>
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {floorsToShow.map((floor) => {
              const floorReady   = floor.tables.filter((n) => getTable(n).status_cocina === 'ready').length;
              const floorOrdered = floor.tables.filter((n) => getTable(n).status_cocina === 'ordered').length;
              const floorCooking = floor.tables.filter((n) => getTable(n).status_cocina === 'cooking').length;
              return (
                <section key={floor.floor}>
                  <div className="flex items-center gap-3 mb-3">
                    <FloorIcon floor={floor.floor} size={18} className="text-slate-400" />
                    <h2 className="text-slate-300 font-bold text-base">{floor.label}</h2>
                    <div className="h-px flex-1 bg-slate-800" />
                    <div className="flex gap-2 text-xs">
                      {floorOrdered > 0 && <span className="text-blue-400 flex items-center gap-0.5"><Zap size={10} />{floorOrdered}</span>}
                      {floorCooking > 0 && <span className="text-amber-400 flex items-center gap-0.5"><Flame size={10} />{floorCooking}</span>}
                      {floorReady   > 0 && <span className="text-orange-400">{floorReady} listo</span>}
                    </div>
                  </div>
                  <div className={`grid gap-3 ${
                    floor.floor === 1 ? 'grid-cols-4 sm:grid-cols-7'
                    : floor.floor === 2 ? 'grid-cols-5 sm:grid-cols-7 md:grid-cols-10'
                    : 'grid-cols-5 sm:grid-cols-7'
                  }`}>
                    {floor.tables.map((num) => (
                      <TableCard key={num} tableNumber={num} status={getTable(num).status_cocina || 'idle'} onClick={() => handleTableClick(num)} variant="kitchen" waiterName={getTable(num).waiterName || ''} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Leyenda ── */}
      {isInitialized && (
        <div className="flex flex-wrap items-center justify-center gap-4 pb-6 px-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-slate-700 border border-slate-600" /><span>Libre</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-blue-600" /><span>Nuevo · confirmar</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-amber-500" /><span>Cocinando</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-yellow-500" /><span>Pase · esperando mozo</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-md bg-orange-500" /><span>Listo · cancelar</span></div>
        </div>
      )}

      {/* ── Botón flotante de voz ── */}
      <VoiceFAB area="cocina" />

      {/* ══ MODAL: Pase o Último ══ */}
      {cookingModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setCookingModalTable(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
              <button onClick={() => setCookingModalTable(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-white mb-1">{cookingModalTable}</div>
                <p className="text-slate-400 text-sm">Mesa {cookingModalTable}</p>
                <p className="text-slate-500 text-xs mt-1">¿Ya está todo o solo una parte?</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => { markPaseForArea(cookingModalTable, 'cocina'); setCookingModalTable(null); }}
                  className="w-full p-4 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 hover:border-yellow-500/50 rounded-2xl transition-all active:scale-95 flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Bell size={22} className="text-yellow-400" />
                  </div>
                  <div className="text-left"><p className="text-white font-bold text-sm">🔔 Pase</p><p className="text-slate-400 text-xs">Hay platos listos, falta más</p></div>
                </button>
                <button onClick={() => { markReadyForArea(cookingModalTable, 'cocina'); setCookingModalTable(null); }}
                  className="w-full p-4 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 hover:border-orange-500/50 rounded-2xl transition-all active:scale-95 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={22} className="text-orange-400" />
                  </div>
                  <div className="text-left"><p className="text-white font-bold text-sm">✅ Último</p><p className="text-slate-400 text-xs">Todo listo, último viaje</p></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
