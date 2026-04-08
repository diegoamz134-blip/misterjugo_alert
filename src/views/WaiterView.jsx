import { useTables, FLOORS } from '../hooks/useTables';
import { useWaiterAlerts } from '../hooks/useAlerts';
import { markTableOrdered, acknowledgeTable, resetTable } from '../services/firebase';
import AlertCard from '../components/AlertCard';
import TableCard from '../components/TableCard';
import logo from '../assets/misterjugo.jpg';

export default function WaiterView({ onChangeMode }) {
  const {
    loading,
    getTable,
    orderedTables,
    cookingTables,
    readyTables,
    isInitialized,
  } = useTables();

  // Alertas: fuerte para "ready", suave para "cooking"
  useWaiterAlerts(readyTables, cookingTables);

  /**
   * Lógica de tap del mozo:
   *  idle    → ordered  (tomé el pedido, aviso a cocina)
   *  ordered → idle     (me equivoqué, cancelo)
   *  cooking → nada     (cocina está trabajando, no interrumpir)
   *  ready   → idle     (fui a buscar el pedido)
   */
  const handleTableClick = async (tableNumber) => {
    const table = getTable(tableNumber);
    switch (table.status) {
      case 'idle':
        await markTableOrdered(tableNumber);
        break;
      case 'ordered':
        await resetTable(tableNumber); // cancelar si se equivocó
        break;
      case 'ready':
        await acknowledgeTable(tableNumber);
        break;
      default:
        break; // cooking: el mozo no puede modificar
    }
  };

  const hasReadyAlerts = readyTables.length > 0;
  const hasCookingInfo = cookingTables.length > 0;
  const hasOrderedInfo = orderedTables.length > 0;

  return (
    <div className={`min-h-screen transition-colors duration-700 ${hasReadyAlerts ? 'bg-[#1c0800]' : 'bg-[#080d1a]'}`}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white overflow-hidden rounded-xl border border-slate-700 shadow">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${hasReadyAlerts ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
            <span className={`text-xs font-bold ${hasReadyAlerts ? 'text-orange-400' : 'text-green-400'}`}>
              {hasReadyAlerts ? '¡Alerta!' : 'En línea'}
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

          {/* ══ SECCIÓN 1: Alertas de pedido LISTO ══ */}
          {hasReadyAlerts && (
            <div>
              <div className="text-center py-4">
                <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">⚡ Cocina Avisa</p>
                <h2 className="text-white font-extrabold text-2xl">
                  {readyTables.length === 1 ? '¡Tu mesa está lista!' : `${readyTables.length} mesas listas`}
                </h2>
              </div>
              <div className="max-w-sm mx-auto space-y-4">
                {readyTables.map((table) => (
                  <AlertCard
                    key={table.id}
                    tableNumber={table.tableNumber || parseInt(table.id)}
                    onAcknowledge={() => handleTableClick(table.tableNumber || parseInt(table.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ══ SECCIÓN 2: Pedidos en preparación ══ */}
          {hasCookingInfo && (
            <div className="max-w-sm mx-auto">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <p className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <span>🔥</span> En preparación
                </p>
                <div className="flex flex-wrap gap-2">
                  {cookingTables.map((t) => (
                    <div key={t.id}
                      className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-1.5 text-amber-300 font-bold text-sm">
                      Mesa {t.tableNumber || parseInt(t.id)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ SECCIÓN 3: Pedidos enviados esperando confirmación ══ */}
          {hasOrderedInfo && (
            <div className="max-w-sm mx-auto">
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4">
                <p className="text-blue-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <span>⏳</span> Esperando confirmación de cocina
                </p>
                <div className="flex flex-wrap gap-2">
                  {orderedTables.map((t) => (
                    <div key={t.id}
                      className="bg-blue-600/20 border border-blue-400/40 rounded-xl px-3 py-1.5 text-blue-300 font-bold text-sm">
                      Mesa {t.tableNumber || parseInt(t.id)}
                    </div>
                  ))}
                </div>
                <p className="text-blue-500/70 text-xs mt-2">Toca la mesa en el panel para cancelar si te equivocaste</p>
              </div>
            </div>
          )}

          {/* ══ SECCIÓN 4: Grid de mesas por pisos ══ */}
          <div>
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-4 px-1">
              Mesas · Toca para registrar pedido
            </h3>
            <div className="space-y-5">
              {FLOORS.map((floor) => (
                <div key={floor.floor}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{floor.emoji}</span>
                    <span className="text-slate-400 text-sm font-semibold">{floor.label}</span>
                    <div className="h-px flex-1 bg-slate-800/60" />
                  </div>
                  <div className={`grid gap-2 ${
                    floor.floor === 1 ? 'grid-cols-4 sm:grid-cols-7'
                    : floor.floor === 2 ? 'grid-cols-5 sm:grid-cols-7'
                    : 'grid-cols-5 sm:grid-cols-7'
                  }`}>
                    {floor.tables.map((num) => (
                      <TableCard
                        key={num}
                        tableNumber={num}
                        status={getTable(num).status || 'idle'}
                        onClick={() => handleTableClick(num)}
                        variant="waiter"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ Leyenda para el mozo ══ */}
          <div className="max-w-sm mx-auto">
            <div className="bg-slate-800/40 rounded-2xl p-4 space-y-2">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Guía rápida</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-md bg-slate-700 border border-slate-600 flex-shrink-0" />
                <span>Libre → toca para registrar pedido</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-md bg-blue-600 flex-shrink-0" />
                <span>Enviado → esperando que cocina confirme</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-md bg-amber-500 flex-shrink-0" />
                <span>🔥 En preparación → cocina trabajando</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-md bg-orange-500 flex-shrink-0" />
                <span>¡Listo! → vas a buscar el pedido</span>
              </div>
            </div>
          </div>

          {/* ══ Estado si todo en orden ══ */}
          {!hasReadyAlerts && !hasCookingInfo && !hasOrderedInfo && isInitialized && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 w-24 h-24 rounded-full border border-slate-700/40 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="relative w-24 h-24 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                  <span className="text-4xl breathe">🛎️</span>
                </div>
              </div>
              <p className="text-slate-400 font-semibold">Sin pedidos activos</p>
              <p className="text-slate-600 text-sm mt-1">Toca una mesa para registrar un pedido</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
