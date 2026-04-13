import { Flame, GlassWater, User } from 'lucide-react';

// Colores por estado para cada área en la vista dividida (waiter)
const SPLIT_COLORS = {
  cocina: {
    idle: 'bg-slate-800',
    ordered: 'bg-blue-600',
    cooking: 'bg-amber-500',
    pase: 'bg-yellow-500',
    ready: 'bg-orange-500',
  },
  jugo: {
    idle: 'bg-slate-800',
    ordered: 'bg-blue-500',
    cooking: 'bg-emerald-500',
    pase: 'bg-lime-500',
    ready: 'bg-emerald-400',
  },
};

/**
 * Tarjeta de mesa — 4 estados: idle / ordered / cooking / ready
 * Variantes: kitchen, waiter, jugo
 * En variante waiter con statusJugo muestra diseño dividido cuando ambas áreas activas.
 */
export default function TableCard({ tableNumber, status, statusJugo, onClick, variant = 'kitchen', waiterName = '' }) {
  // ── Modo dividido (waiter con ambas áreas activas) ──────────────────────
  const cocStatus = status || 'idle';
  const jugStatus = statusJugo || 'idle';
  const showSplit =
    variant === 'waiter' &&
    statusJugo !== undefined &&
    cocStatus !== 'idle' &&
    jugStatus !== 'idle';

  if (showSplit) {
    const cocColor = SPLIT_COLORS.cocina[cocStatus] || 'bg-slate-800';
    const jugColor = SPLIT_COLORS.jugo[jugStatus] || 'bg-slate-800';
    const hasPulse = cocStatus === 'ready' || jugStatus === 'ready' || cocStatus === 'ordered' || jugStatus === 'ordered' || cocStatus === 'pase' || jugStatus === 'pase';

    return (
      <button
        onClick={onClick}
        className={[
          'relative flex flex-col items-center justify-center overflow-hidden',
          'rounded-2xl border-2 border-slate-600 font-bold',
          'transition-all duration-200 select-none',
          'active:scale-95 touch-manipulation aspect-square w-full',
          hasPulse ? 'alert-pulse' : '',
        ].join(' ')}
        aria-label={`Mesa ${tableNumber} - cocina:${cocStatus} jugos:${jugStatus}`}
      >
        {/* Mitad izquierda — Cocina */}
        <div className={`absolute inset-y-0 left-0 w-1/2 ${cocColor} transition-colors duration-300`} />
        {/* Mitad derecha — Jugos */}
        <div className={`absolute inset-y-0 right-0 w-1/2 ${jugColor} transition-colors duration-300`} />
        {/* Línea divisoria */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-black/30 z-10" />

        {/* Número centrado */}
        <span className={`relative z-20 font-black leading-none text-white drop-shadow-lg ${tableNumber >= 10 ? 'text-xl' : 'text-2xl'}`}>
          {tableNumber}
        </span>

        {/* Iconos de área debajo del número */}
        <div className="relative z-20 flex items-center gap-1 mt-1">
          <span title="Cocina">
            <Flame size={9} className="text-white/80" />
          </span>
          <span title="Jugos">
            <GlassWater size={9} className="text-white/80" />
          </span>
        </div>
        {/* Nombre del mesero */}
        {waiterName && (
          <div className="relative z-20 flex items-center gap-0.5 mt-0.5 px-1 max-w-full">
            <User size={7} className="text-white/70 flex-shrink-0" />
            <span className="text-[8px] text-white/80 font-semibold truncate leading-none" style={{ maxWidth: '90%' }}>
              {waiterName}
            </span>
          </div>
        )}

        {/* Dot pulsante si alguna está ready u ordered */}
        {hasPulse && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
        )}
      </button>
    );
  }

  // ── Modo normal ────────────────────────────────────────────────────────────
  const isOrdered = status === 'ordered';
  const isCooking = status === 'cooking';
  const isReady   = status === 'ready';

  const stateStyles = {
    idle:    'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500',
    ordered: 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/40 alert-pulse',
    cooking: 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-400/30',
    pase:    'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-400/30 alert-pulse',
    ready:   variant === 'jugo'
      ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 alert-pulse'
      : 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/40 alert-pulse',
  };

  const labels = {
    idle:    'Libre',
    ordered: variant === 'waiter' ? 'Enviado' : 'Nuevo',
    cooking: variant === 'jugo' ? 'Preparando' : 'En cocina',
    pase:    variant === 'waiter' ? 'Pase' : 'En pase',
    ready:   'Listo',
  };

  const labelColors = {
    idle:    'text-slate-500',
    ordered: 'text-blue-100',
    cooking: 'text-amber-100',
    pase:    'text-yellow-100',
    ready:   variant === 'jugo' ? 'text-emerald-100' : 'text-orange-100',
  };

  // Para el mozo con solo un área activa: usar el que tenga mayor prioridad
  let finalStatus = status;
  if (variant === 'waiter' && statusJugo !== undefined) {
    const priority = { idle: 0, ordered: 1, cooking: 2, ready: 3 };
    const cocPri = priority[cocStatus] || 0;
    const jugPri = priority[jugStatus] || 0;
    finalStatus = jugPri > cocPri ? jugStatus : cocStatus;
  }

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-center justify-center',
        'rounded-2xl border-2 font-bold',
        'transition-all duration-200 select-none',
        'active:scale-95 touch-manipulation aspect-square w-full',
        stateStyles[finalStatus] || stateStyles.idle,
      ].join(' ')}
      aria-label={`Mesa ${tableNumber} - ${finalStatus}`}
    >
      <span className={`font-black leading-none ${tableNumber >= 10 ? 'text-xl' : 'text-2xl'}`}>
        {tableNumber}
      </span>
      <span className={`text-[10px] mt-1 font-semibold uppercase tracking-wider ${labelColors[finalStatus] || labelColors.idle}`}>
        {labels[finalStatus] || 'Libre'}
      </span>
      {/* Nombre del mesero */}
      {waiterName && finalStatus !== 'idle' && (
        <div className="flex items-center gap-0.5 mt-0.5 px-1 max-w-full">
          <User size={7} className="text-white/70 flex-shrink-0" />
          <span className="text-[8px] text-white/80 font-semibold truncate leading-none" style={{ maxWidth: '90%' }}>
            {waiterName}
          </span>
        </div>
      )}

      {(finalStatus === 'ready' || finalStatus === 'ordered' || finalStatus === 'pase') && (
        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
      )}
      {finalStatus === 'cooking' && variant !== 'jugo' && (
        <span className="absolute top-1 right-1">
          <Flame size={10} className="text-amber-100" />
        </span>
      )}
      {finalStatus === 'cooking' && variant === 'jugo' && (
        <span className="absolute top-1 right-1">
          <GlassWater size={10} className="text-amber-100" />
        </span>
      )}
    </button>
  );
}
