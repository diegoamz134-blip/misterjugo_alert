import { CheckCircle2, Utensils, GlassWater, User } from 'lucide-react';

/**
 * Tarjeta de alerta grande para la Vista Mozos
 * area: 'cocina' (naranja) o 'jugo' (esmeralda)
 * waiterName: nombre del mozo que hizo el pedido (opcional)
 */
export default function AlertCard({ tableNumber, onAcknowledge, area = 'cocina', waiterName, isPase = false }) {
  const isJugo = area === 'jugo';

  let gradientClass, lightTextClass, medTextClass, dimTextClass, btnTextClass, btnHoverClass, shadowClass, badgeBg;

  if (isPase) {
    gradientClass  = isJugo ? 'from-lime-500 to-lime-600 shadow-lime-500/50 border-lime-400/30' : 'from-yellow-500 to-amber-600 shadow-yellow-500/50 border-yellow-400/30';
    lightTextClass = isJugo ? 'text-lime-100' : 'text-yellow-100';
    medTextClass   = isJugo ? 'text-lime-200' : 'text-yellow-200';
    dimTextClass   = isJugo ? 'text-lime-200/80' : 'text-yellow-200/80';
    btnTextClass   = isJugo ? 'text-lime-700' : 'text-yellow-700';
    btnHoverClass  = isJugo ? 'hover:bg-lime-50' : 'hover:bg-yellow-50';
    shadowClass    = isJugo ? 'shadow-lime-900/20' : 'shadow-yellow-900/20';
    badgeBg        = isJugo ? 'bg-lime-400/20 border-lime-300/30' : 'bg-yellow-400/20 border-yellow-300/30';
  } else if (isJugo) {
    gradientClass  = 'from-emerald-500 to-emerald-600 shadow-emerald-500/50 border-emerald-400/30';
    lightTextClass = 'text-emerald-100';
    medTextClass   = 'text-emerald-200';
    dimTextClass   = 'text-emerald-200/80';
    btnTextClass   = 'text-emerald-600';
    btnHoverClass  = 'hover:bg-emerald-50';
    shadowClass    = 'shadow-emerald-900/20';
    badgeBg        = 'bg-emerald-400/20 border-emerald-300/30';
  } else {
    gradientClass  = 'from-orange-500 to-orange-600 shadow-orange-500/50 border-orange-400/30';
    lightTextClass = 'text-orange-100';
    medTextClass   = 'text-orange-200';
    dimTextClass   = 'text-orange-200/80';
    btnTextClass   = 'text-orange-600';
    btnHoverClass  = 'hover:bg-orange-50';
    shadowClass    = 'shadow-orange-900/20';
    badgeBg        = 'bg-orange-400/20 border-orange-300/30';
  }

  const Icon = isJugo ? GlassWater : Utensils;
  const label = isPase
    ? (isJugo ? 'Pase Jugo' : 'Pase Cocina')
    : (isJugo ? 'Jugo Listo' : 'Pedido Listo');
  const sublabel = isPase
    ? 'Hay platos listos, pero falta más'
    : (isJugo ? 'El jugo está listo para entregar' : 'El pedido está listo para entregar');

  return (
    <div className={`slide-up alert-pulse bg-gradient-to-br ${gradientClass} rounded-3xl p-6 text-white shadow-2xl border`}>
      {/* Indicador superior */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <p className={`${lightTextClass} font-semibold text-xs uppercase tracking-widest flex items-center gap-1`}>
          <Icon size={12} /> {label}
        </p>
      </div>

      {/* Número de mesa */}
      <div className="text-center my-4">
        <p className={`${medTextClass} text-sm font-medium mb-1`}>Mesa</p>
        <div className="text-8xl font-black leading-none drop-shadow-lg">
          {tableNumber}
        </div>
        <p className={`${lightTextClass} text-lg font-bold mt-2`}>{isPase ? `Mesa ${tableNumber} — Pase` : `Mesa ${tableNumber} Lista`}</p>
        <p className={`${dimTextClass} text-sm mt-1`}>{sublabel}</p>
      </div>

      {/* Badge del mozo (si hay nombre) */}
      {waiterName && (
        <div className={`flex items-center justify-center gap-1.5 mb-3 px-3 py-1.5 rounded-xl border ${badgeBg} w-fit mx-auto`}>
          <User size={11} className={lightTextClass} />
          <span className={`${lightTextClass} text-xs font-semibold`}>{waiterName}</span>
        </div>
      )}

      {/* Botón de confirmación */}
      <button
        onClick={onAcknowledge}
        className={`w-full mt-2 py-4 bg-white ${btnTextClass} font-extrabold text-lg
                   rounded-2xl transition-all duration-150
                   active:scale-95 ${btnHoverClass}
                   shadow-lg ${shadowClass}
                   flex items-center justify-center gap-2`}
      >
        <CheckCircle2 size={22} />
        <span>{isPase ? 'Ya Recogí' : 'Voy en Camino'}</span>
      </button>
    </div>
  );
}
