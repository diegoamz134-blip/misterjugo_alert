import { CheckCircle2, Utensils } from 'lucide-react';

/**
 * Tarjeta de alerta grande para la Vista Mozos
 */
export default function AlertCard({ tableNumber, onAcknowledge }) {
  return (
    <div className="slide-up alert-pulse bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-2xl shadow-orange-500/50 border border-orange-400/30">
      {/* Indicador superior */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <p className="text-orange-100 font-semibold text-xs uppercase tracking-widest flex items-center gap-1">
          <Utensils size={12} /> Pedido Listo
        </p>
      </div>

      {/* Número de mesa */}
      <div className="text-center my-4">
        <p className="text-orange-200 text-sm font-medium mb-1">Mesa</p>
        <div className="text-8xl font-black leading-none drop-shadow-lg">
          {tableNumber}
        </div>
        <p className="text-orange-100 text-lg font-bold mt-2">Mesa {tableNumber} Lista</p>
        <p className="text-orange-200/80 text-sm mt-1">El pedido está listo para entregar</p>
      </div>

      {/* Botón de confirmación */}
      <button
        onClick={onAcknowledge}
        className="w-full mt-4 py-4 bg-white text-orange-600 font-extrabold text-lg
                   rounded-2xl transition-all duration-150
                   active:scale-95 hover:bg-orange-50
                   shadow-lg shadow-orange-900/20
                   flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={22} />
        <span>Voy en Camino</span>
      </button>
    </div>
  );
}
