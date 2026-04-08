/**
 * Tarjeta de mesa — soporta 4 estados:
 *
 *  idle     → gris oscuro  (libre)
 *  ordered  → azul pulsante (mozo envió pedido, esperando cocina)
 *  cooking  → ámbar        (cocina confirmó, en preparación)
 *  ready    → naranja pulsante (¡listo para entregar!)
 */
export default function TableCard({ tableNumber, status, onClick, variant = 'kitchen' }) {
  const isOrdered = status === 'ordered';
  const isCooking = status === 'cooking';
  const isReady   = status === 'ready';
  const isIdle    = !isOrdered && !isCooking && !isReady;

  // ── Estilos por estado ──────────────────────────────────────
  const stateStyles = {
    idle:    'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500',
    ordered: 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/40 alert-pulse',
    cooking: 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-400/30',
    ready:   'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/40 alert-pulse',
  };

  const currentStyle = stateStyles[status] || stateStyles.idle;

  // ── Etiqueta de estado ──────────────────────────────────────
  const labels = {
    idle:    variant === 'waiter' ? 'Libre' : 'Libre',
    ordered: variant === 'waiter' ? 'Enviado ✓' : 'Nuevo ⚡',
    cooking: 'En cocina',
    ready:   '¡Listo!',
  };

  const labelColors = {
    idle:    'text-slate-500',
    ordered: 'text-blue-100',
    cooking: 'text-amber-100',
    ready:   'text-orange-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={isIdle && variant === 'kitchen' && false} // kitchen siempre clickeable
      className={[
        'relative flex flex-col items-center justify-center',
        'rounded-2xl border-2 font-bold',
        'transition-all duration-200 select-none',
        'active:scale-95 touch-manipulation aspect-square w-full',
        currentStyle,
      ].join(' ')}
      aria-label={`Mesa ${tableNumber} - ${status}`}
    >
      {/* Número */}
      <span className={`font-black leading-none ${tableNumber >= 10 ? 'text-xl' : 'text-2xl'}`}>
        {tableNumber}
      </span>

      {/* Etiqueta */}
      <span className={`text-[10px] mt-1 font-semibold uppercase tracking-wider ${labelColors[status] || labelColors.idle}`}>
        {labels[status] || 'Libre'}
      </span>

      {/* Dot de notificación */}
      {(isReady || isOrdered) && (
        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
      )}

      {/* Ícono de estado (cooking) */}
      {isCooking && (
        <span className="absolute top-1 right-1.5 text-[10px]">🔥</span>
      )}
    </button>
  );
}
