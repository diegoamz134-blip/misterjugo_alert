import { useState } from 'react';
import { Bell, Flame, Zap, Clock, Home, Building2, Landmark, GlassWater, ChefHat, X, User } from 'lucide-react';
import { useTables, FLOORS } from '../hooks/useTables';
import { useWaiterDualAlerts } from '../hooks/useAlerts';
import { markTableOrderedForArea, acknowledgeForArea, acknowledgePaseForArea, resetTableForArea } from '../services/firebase';
import AlertCard from '../components/AlertCard';
import TableCard from '../components/TableCard';
import logo from '../assets/misterjugo.jpg';

const FloorIcon = ({ floor, size = 14 }) => {
  if (floor === 1) return <Home size={size} />;
  if (floor === 2) return <Building2 size={size} />;
  return <Landmark size={size} />;
};

export default function WaiterView({ onChangeMode, waiterName, onChangeName }) {
  const {
    loading, getTable,
    orderedTablesKitchen: _orderedTablesKitchen,
    cookingTablesKitchen: _cookingTablesKitchen,
    readyTablesKitchen: _readyTablesKitchen,
    orderedTablesJugo: _orderedTablesJugo,
    cookingTablesJugo: _cookingTablesJugo,
    readyTablesJugo: _readyTablesJugo,
    paseTablesKitchen: _paseTablesKitchen,
    paseTablesJugo: _paseTablesJugo,
    isInitialized
  } = useTables();

  // ── Filtrar por mesero: solo mostrar las mesas propias ──
  const esMiMesa = (t) => {
    if (!waiterName) return true;       // sin nombre configurado → mostrar todo
    if (!t.waiterName) return true;     // mesa sin asignar → mostrar (fallback)
    return t.waiterName === waiterName;
  };

  const readyTablesKitchen   = _readyTablesKitchen.filter(esMiMesa);
  const cookingTablesKitchen = _cookingTablesKitchen.filter(esMiMesa);
  const orderedTablesKitchen = _orderedTablesKitchen.filter(esMiMesa);
  const readyTablesJugo      = _readyTablesJugo.filter(esMiMesa);
  const cookingTablesJugo    = _cookingTablesJugo.filter(esMiMesa);
  const orderedTablesJugo    = _orderedTablesJugo.filter(esMiMesa);
  const paseTablesKitchen    = _paseTablesKitchen.filter(esMiMesa);
  const paseTablesJugo       = _paseTablesJugo.filter(esMiMesa);

  useWaiterDualAlerts(readyTablesKitchen, cookingTablesKitchen, readyTablesJugo, cookingTablesJugo, waiterName, paseTablesKitchen, paseTablesJugo);

  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableClick = (tableNumber) => {
    const table = getTable(tableNumber);
    const cocinaIdle = table.status_cocina === 'idle';
    const jugoIdle = table.status_jugo === 'idle';

    // Bloquear si la mesa pertenece a otro mesero y no está libre
    const otroMesero = table.waiterName && waiterName && table.waiterName !== waiterName;
    const mesaOcupada = !cocinaIdle || !jugoIdle;
    if (otroMesero && mesaOcupada) return; // No permitir tocar mesa de otro

    if (cocinaIdle && jugoIdle) { setSelectedTable(tableNumber); return; }
    if (!cocinaIdle && !jugoIdle && table.status_cocina === 'ordered') { setSelectedTable(tableNumber); return; }
    if (cocinaIdle && !jugoIdle) { setSelectedTable(tableNumber); return; }
    if (!cocinaIdle && jugoIdle) { setSelectedTable(tableNumber); return; }
    if (table.status_cocina === 'pase') { acknowledgePaseForArea(tableNumber, 'cocina'); return; }
    if (table.status_jugo === 'pase') { acknowledgePaseForArea(tableNumber, 'jugo'); return; }
    if (table.status_cocina === 'ready') { acknowledgeForArea(tableNumber, 'cocina'); return; }
    if (table.status_jugo === 'ready') { acknowledgeForArea(tableNumber, 'jugo'); return; }
    if (table.status_cocina === 'ordered') { resetTableForArea(tableNumber, 'cocina'); return; }
    if (table.status_jugo === 'ordered') { resetTableForArea(tableNumber, 'jugo'); return; }
  };

  const handleSelectArea = (area) => {
    if (!selectedTable) return;
    markTableOrderedForArea(selectedTable, area, waiterName);
    setSelectedTable(null);
  };

  const getModalOptions = () => {
    if (!selectedTable) return [];
    const table = getTable(selectedTable);
    const options = [];
    if (table.status_cocina === 'idle') options.push('cocina');
    if (table.status_jugo === 'idle') options.push('jugo');
    if (table.status_cocina === 'idle' && table.status_jugo === 'idle') options.push('ambos');
    return options;
  };

  const hasReadyKitchen = readyTablesKitchen.length > 0;
  const hasReadyJugo    = readyTablesJugo.length > 0;
  const hasReadyAlerts  = hasReadyKitchen || hasReadyJugo;
  const hasPaseKitchen  = paseTablesKitchen.length > 0;
  const hasPaseJugo     = paseTablesJugo.length > 0;
  const hasPaseAlerts   = hasPaseKitchen || hasPaseJugo;
  const hasCookingKitchen = cookingTablesKitchen.length > 0;
  const hasCookingJugo    = cookingTablesJugo.length > 0;
  const hasOrderedKitchen = orderedTablesKitchen.length > 0;
  const hasOrderedJugo    = orderedTablesJugo.length > 0;
  const hasCookingInfo    = hasCookingKitchen || hasCookingJugo;
  const hasOrderedInfo    = hasOrderedKitchen || hasOrderedJugo;

  return (
    <div className={`min-h-screen transition-colors duration-700 ${hasReadyAlerts ? 'bg-[#1c0800]' : hasPaseAlerts ? 'bg-[#1a1500]' : 'bg-[#080d1a]'}`}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white overflow-hidden rounded-xl border border-slate-700 shadow">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          {/* Nombre del mozo */}
          <button onClick={onChangeName} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:bg-slate-700 transition-all">
            <User size={13} className="text-slate-400" />
            <span className="text-white font-bold text-sm">{waiterName}</span>
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <div className={`w-2 h-2 rounded-full ${hasReadyAlerts ? 'bg-orange-500 animate-pulse' : hasPaseAlerts ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className={`text-xs font-bold ${hasReadyAlerts ? 'text-orange-400' : hasPaseAlerts ? 'text-yellow-400' : 'text-green-400'}`}>
              {hasReadyAlerts ? 'Alerta activa' : hasPaseAlerts ? 'Pase pendiente' : 'En línea'}
            </span>
          </div>
        </div>
        <button onClick={onChangeMode}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl transition-all border border-slate-700/50">
          Cambiar Vista
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Conectando...</p>
        </div>
      ) : (
        <div className="px-4 pb-10 space-y-6">

          {/* ══ Alertas COCINA LISTO ══ */}
          {hasReadyKitchen && (
            <div>
              <div className="text-center py-4">
                <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <Zap size={12} /> Cocina Avisa
                </p>
                <h2 className="text-white font-extrabold text-2xl">
                  {readyTablesKitchen.length === 1 ? '¡Tu mesa está lista!' : `${readyTablesKitchen.length} mesas listas`}
                </h2>
              </div>
              <div className="max-w-sm mx-auto space-y-4">
                {readyTablesKitchen.map((table) => {
                  const num = table.tableNumber || parseInt(table.id);
                  const t = getTable(num);
                  return (
                    <AlertCard key={`k_${table.id}`}
                      tableNumber={num}
                      area="cocina"
                      waiterName={t.waiterName}
                      onAcknowledge={() => acknowledgeForArea(num, 'cocina')} />
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ Alertas JUGO LISTO ══ */}
          {hasReadyJugo && (
            <div>
              <div className="text-center py-4">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <GlassWater size={12} /> Jugos Avisa
                </p>
                <h2 className="text-white font-extrabold text-2xl">
                  {readyTablesJugo.length === 1 ? '¡Tu jugo está listo!' : `${readyTablesJugo.length} jugos listos`}
                </h2>
              </div>
              <div className="max-w-sm mx-auto space-y-4">
                {readyTablesJugo.map((table) => {
                  const num = table.tableNumber || parseInt(table.id);
                  const t = getTable(num);
                  return (
                    <AlertCard key={`j_${table.id}`}
                      tableNumber={num}
                      area="jugo"
                      waiterName={t.waiterName}
                      onAcknowledge={() => acknowledgeForArea(num, 'jugo')} />
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ Pase parcial COCINA ══ */}
          {hasPaseKitchen && (
            <div>
              <div className="text-center py-4">
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <Bell size={12} /> Pase Cocina
                </p>
                <h2 className="text-white font-extrabold text-2xl">
                  {paseTablesKitchen.length === 1 ? '¡Pase parcial!' : `${paseTablesKitchen.length} pases parciales`}
                </h2>
              </div>
              <div className="max-w-sm mx-auto space-y-4">
                {paseTablesKitchen.map((table) => {
                  const num = table.tableNumber || parseInt(table.id);
                  const t = getTable(num);
                  return (
                    <AlertCard key={`pk_${table.id}`}
                      tableNumber={num}
                      area="cocina"
                      isPase
                      waiterName={t.waiterName}
                      onAcknowledge={() => acknowledgePaseForArea(num, 'cocina')} />
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ Pase parcial JUGO ══ */}
          {hasPaseJugo && (
            <div>
              <div className="text-center py-4">
                <p className="text-lime-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                  <GlassWater size={12} /> Pase Jugos
                </p>
                <h2 className="text-white font-extrabold text-2xl">
                  {paseTablesJugo.length === 1 ? '¡Pase parcial!' : `${paseTablesJugo.length} pases parciales`}
                </h2>
              </div>
              <div className="max-w-sm mx-auto space-y-4">
                {paseTablesJugo.map((table) => {
                  const num = table.tableNumber || parseInt(table.id);
                  const t = getTable(num);
                  return (
                    <AlertCard key={`pj_${table.id}`}
                      tableNumber={num}
                      area="jugo"
                      isPase
                      waiterName={t.waiterName}
                      onAcknowledge={() => acknowledgePaseForArea(num, 'jugo')} />
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ En preparación COCINA ══ */}
          {hasCookingKitchen && (
            <div className="max-w-sm mx-auto">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <p className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2"><Flame size={16} /> En cocina</p>
                <div className="flex flex-wrap gap-2">
                  {cookingTablesKitchen.map((t) => (
                    <div key={t.id} className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-1.5 text-amber-300 font-bold text-sm">
                      Mesa {t.tableNumber || parseInt(t.id)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ En preparación JUGOS ══ */}
          {hasCookingJugo && (
            <div className="max-w-sm mx-auto">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                <p className="text-emerald-400 font-bold text-sm mb-3 flex items-center gap-2"><GlassWater size={16} /> Preparando jugos</p>
                <div className="flex flex-wrap gap-2">
                  {cookingTablesJugo.map((t) => (
                    <div key={t.id} className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-3 py-1.5 text-emerald-300 font-bold text-sm">
                      Mesa {t.tableNumber || parseInt(t.id)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ Esperando confirmación COCINA ══ */}
          {hasOrderedKitchen && (
            <div className="max-w-sm mx-auto">
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4">
                <p className="text-blue-400 font-bold text-sm mb-3 flex items-center gap-2"><Clock size={16} /> Esperando confirmación de cocina</p>
                <div className="flex flex-wrap gap-2">
                  {orderedTablesKitchen.map((t) => (
                    <div key={t.id} className="bg-blue-600/20 border border-blue-400/40 rounded-xl px-3 py-1.5 text-blue-300 font-bold text-sm">
                      Mesa {t.tableNumber || parseInt(t.id)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ Esperando confirmación JUGOS ══ */}
          {hasOrderedJugo && (
            <div className="max-w-sm mx-auto">
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4">
                <p className="text-blue-400 font-bold text-sm mb-3 flex items-center gap-2"><Clock size={16} /> Esperando confirmación de jugos</p>
                <div className="flex flex-wrap gap-2">
                  {orderedTablesJugo.map((t) => (
                    <div key={t.id} className="bg-blue-600/20 border border-blue-400/40 rounded-xl px-3 py-1.5 text-blue-300 font-bold text-sm">
                      Mesa {t.tableNumber || parseInt(t.id)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ Grid de mesas ══ */}
          <div>
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-4 px-1">
              Mesas · Toca para registrar pedido
            </h3>
            <div className="space-y-5">
              {FLOORS.map((floor) => (
                <div key={floor.floor}>
                  <div className="flex items-center gap-2 mb-2">
                    <FloorIcon floor={floor.floor} size={16} />
                    <span className="text-slate-400 text-sm font-semibold">{floor.label}</span>
                    <div className="h-px flex-1 bg-slate-800/60" />
                  </div>
                  <div className={`grid gap-2 ${
                    floor.floor === 1 ? 'grid-cols-4 sm:grid-cols-7'
                    : floor.floor === 2 ? 'grid-cols-5 sm:grid-cols-7'
                    : 'grid-cols-5 sm:grid-cols-7'
                  }`}>
                    {floor.tables.map((num) => {
                      const t = getTable(num);
                      const esDeOtro = t.waiterName && waiterName && t.waiterName !== waiterName;
                      const mesaOcupada = t.status_cocina !== 'idle' || t.status_jugo !== 'idle';
                      const bloqueado = esDeOtro && mesaOcupada;
                      return (
                        <div key={num} className={`relative ${bloqueado ? 'opacity-50' : ''}`} title={bloqueado ? `Mesa de ${t.waiterName}` : ''}>
                          <TableCard
                            tableNumber={num}
                            status={t.status_cocina || 'idle'}
                            statusJugo={t.status_jugo || 'idle'}
                            onClick={() => handleTableClick(num)}
                            variant="waiter"
                            waiterName={t.waiterName || ''}
                          />
                          {bloqueado && (
                            <div className="absolute inset-0 rounded-2xl cursor-not-allowed" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ Leyenda ══ */}
          <div className="max-w-sm mx-auto">
            <div className="bg-slate-800/40 rounded-2xl p-4 space-y-2">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Guía rápida</p>
              <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded-md bg-slate-700 border border-slate-600 flex-shrink-0" /><span>Libre → toca para registrar pedido</span></div>
              <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded-md bg-blue-600 flex-shrink-0" /><span>Enviado → esperando confirmación</span></div>
              <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded-md bg-amber-500 flex-shrink-0" /><span>En preparación → cocina/jugos trabajando</span></div>
              <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded-md bg-yellow-500 flex-shrink-0" /><span>Pase → hay platos listos, falta más</span></div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-md overflow-hidden flex-shrink-0 flex">
                  <div className="w-1/2 bg-amber-500" /><div className="w-1/2 bg-emerald-500" />
                </div>
                <span>Tarjeta dividida → ambas áreas activas</span>
              </div>
            </div>
          </div>

          {/* ══ Standby ══ */}
          {!hasReadyAlerts && !hasPaseAlerts && !hasCookingInfo && !hasOrderedInfo && isInitialized && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 w-24 h-24 rounded-full border border-slate-700/40 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="relative w-24 h-24 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                  <Bell size={40} className="text-slate-500 breathe" />
                </div>
              </div>
              <p className="text-slate-400 font-semibold">Sin pedidos activos</p>
              <p className="text-slate-600 text-sm mt-1">Toca una mesa para registrar un pedido</p>
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL selección de área ══ */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setSelectedTable(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
              <button onClick={() => setSelectedTable(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-white mb-1">{selectedTable}</div>
                <p className="text-slate-400 text-sm">Mesa {selectedTable}</p>
                <p className="text-slate-500 text-xs mt-1">¿A dónde va el pedido?</p>
              </div>
              <div className="space-y-3">
                {getModalOptions().includes('cocina') && (
                  <button onClick={() => handleSelectArea('cocina')}
                    className="w-full p-4 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 hover:border-orange-500/50 rounded-2xl transition-all active:scale-95 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <ChefHat size={22} className="text-orange-400" />
                    </div>
                    <div className="text-left"><p className="text-white font-bold text-sm">Cocina</p><p className="text-slate-400 text-xs">Solo comida</p></div>
                  </button>
                )}
                {getModalOptions().includes('jugo') && (
                  <button onClick={() => handleSelectArea('jugo')}
                    className="w-full p-4 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl transition-all active:scale-95 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <GlassWater size={22} className="text-emerald-400" />
                    </div>
                    <div className="text-left"><p className="text-white font-bold text-sm">Jugos</p><p className="text-slate-400 text-xs">Solo jugos</p></div>
                  </button>
                )}
                {getModalOptions().includes('ambos') && (
                  <button onClick={() => handleSelectArea('ambos')}
                    className="w-full p-4 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 hover:border-blue-500/50 rounded-2xl transition-all active:scale-95 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <div className="flex items-center gap-0.5">
                        <ChefHat size={14} className="text-blue-400" />
                        <GlassWater size={14} className="text-blue-400" />
                      </div>
                    </div>
                    <div className="text-left"><p className="text-white font-bold text-sm">Ambos</p><p className="text-slate-400 text-xs">Comida y jugos</p></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
