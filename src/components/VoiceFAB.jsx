import { Mic, MicOff } from 'lucide-react';
import { useVoiceCommand } from '../hooks/useVoiceCommand';

/**
 * Botón flotante de voz para KitchenView y JugoView.
 * area: 'cocina' | 'jugo'
 */
export default function VoiceFAB({ area = 'cocina' }) {
  const { listening, feedback, isSupported, startListening, stopListening } = useVoiceCommand(area);

  // Consideramos que si usamos Chrome, estará soportado. Si entran de Brave, simplemente no se pintará o el hook fallará.
  // Es mejor no ocultarlo si falla la detección inicial por un falso positivo, pero como isSupported chequea la API,
  // si es true, lo renderizamos.
  if (!isSupported) return null;

  const isSuccess = feedback?.type === 'success';
  const isError   = feedback?.type === 'error';

  // Colores del botón según área y estado
  const btnBase = area === 'jugo'
    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/50'
    : 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/50';

  const btnListening = 'bg-red-500 hover:bg-red-400 shadow-red-500/60';

  // Color del toast de feedback
  const toastClass = isSuccess
    ? 'bg-green-500/20 border-green-500/40 text-green-300'
    : isError
    ? 'bg-red-500/20 border-red-500/40 text-red-300'
    : 'bg-slate-700/80 border-slate-600/50 text-slate-200';

  return (
    <>
      {/* ── Toast de feedback ── */}
      {feedback && (
        <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-40
                         flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border
                         backdrop-blur-sm shadow-xl text-sm font-semibold
                         max-w-xs w-[90%] text-center slide-up
                         ${toastClass}`}>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── Animación de onda cuando escucha ── */}
      {listening && (
        <>
          <div className="fixed bottom-4 right-4 z-30 w-20 h-20 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
          <div className="fixed bottom-4 right-4 z-30 w-20 h-20 rounded-full bg-red-500/10 animate-ping pointer-events-none" style={{ animationDelay: '0.3s' }} />
        </>
      )}

      {/* ── Botón FAB principal ── */}
      <button
        onPointerDown={listening ? stopListening : startListening}
        className={[
          'fixed bottom-5 right-5 z-40',
          'w-16 h-16 rounded-full',
          'flex items-center justify-center',
          'shadow-2xl transition-all duration-200',
          'active:scale-90 touch-manipulation select-none',
          listening ? btnListening : btnBase,
          listening ? 'scale-110' : 'scale-100',
        ].join(' ')}
        aria-label={listening ? 'Detener escucha' : 'Activar comando de voz'}
        title={listening ? 'Toca para cancelar' : 'Toca y habla: "mesa 8 lista"'}
      >
        {listening
          ? <MicOff size={28} className="text-white" />
          : <Mic size={28} className="text-white" />
        }
      </button>

      {/* ── Etiqueta pequeña debajo del botón ── */}
      <div className={`fixed bottom-1 right-0 w-[4.5rem] text-center z-40 text-[9px] font-semibold pointer-events-none transition-all
                       ${listening ? 'text-red-400' : 'text-slate-600'}`}>
        {listening ? 'Habla ahora' : 'Voz'}
      </div>
    </>
  );
}
