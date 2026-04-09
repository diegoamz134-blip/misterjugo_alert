import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import logo from '../assets/misterjugo.jpg';

export default function WaiterNameScreen({ onConfirm }) {
  const [name, setName] = useState('');

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center p-6">
      {/* Logo pequeño */}
      <div className="w-16 h-16 bg-white overflow-hidden rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 border border-slate-700 mb-8">
        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
      </div>

      <div className="w-full max-w-xs">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-slate-700 shadow-lg">
            <User size={34} className="text-slate-300" />
          </div>
          <h1 className="text-white font-extrabold text-2xl leading-tight">¿Cuál es tu nombre?</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Así sabremos quién tomó cada pedido
          </p>
        </div>

        {/* Input de nombre */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Tu nombre..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
            maxLength={24}
            className="w-full px-5 py-4 bg-slate-800 border border-slate-700 focus:border-slate-500
                       rounded-2xl text-white text-lg font-semibold placeholder-slate-500
                       focus:outline-none transition-colors duration-150"
          />

          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="w-full p-4 bg-slate-700 hover:bg-slate-600
                       disabled:opacity-30 disabled:cursor-not-allowed
                       rounded-2xl text-white font-extrabold text-base
                       transition-all duration-200 active:scale-98
                       border border-slate-600 hover:border-slate-500
                       flex items-center justify-center gap-2"
          >
            <span>Entrar como mozo</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Tu nombre se guardará en este dispositivo
        </p>
      </div>
    </div>
  );
}
