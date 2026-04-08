import { ArrowRight, ChefHat, BellRing } from 'lucide-react';
import logo from '../assets/misterjugo.jpg';

export default function HomeView({ onSelect }) {
  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center p-6">
      {/* Logo y marca */}
      <div className="text-center mb-12">
        <div className="relative mx-auto w-32 h-32 mb-6">
          <div className="w-32 h-32 bg-white overflow-hidden rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 border-2 border-orange-500/50">
            <img src={logo} alt="MisterJugo Logo" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-orange-500/20 blur-2xl scale-110 -z-10" />
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight">
          Mister<span className="text-orange-500">Jugo</span>
        </h1>
        <p className="text-slate-400 mt-2 text-base">Sistema de Avisos de Cocina</p>
      </div>

      {/* Selección de rol */}
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-slate-500 text-xs uppercase tracking-widest mb-6 font-medium">
          ¿Quién eres?
        </p>

        {/* Cocinero */}
        <button
          onClick={() => onSelect('kitchen')}
          className="w-full p-5 bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-400 hover:to-orange-500
                     rounded-3xl text-white text-left
                     transition-all duration-200 active:scale-98
                     shadow-xl shadow-orange-500/30
                     border border-orange-400/20 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <ChefHat size={30} className="text-white" />
            </div>
            <div>
              <div className="font-extrabold text-xl leading-tight">Soy Cocinero</div>
              <div className="text-orange-100 text-sm mt-0.5">Panel de control de mesas</div>
            </div>
            <div className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ArrowRight size={20} className="text-orange-200" />
            </div>
          </div>
        </button>

        {/* Mozo */}
        <button
          onClick={() => onSelect('waiter')}
          className="w-full p-5 bg-slate-800/80 hover:bg-slate-700/80
                     rounded-3xl text-white text-left
                     transition-all duration-200 active:scale-98
                     border border-slate-700 hover:border-slate-600
                     shadow-lg group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <BellRing size={30} className="text-slate-300" />
            </div>
            <div>
              <div className="font-extrabold text-xl leading-tight">Soy Mozo</div>
              <div className="text-slate-400 text-sm mt-0.5">Recibir avisos de cocina</div>
            </div>
            <div className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ArrowRight size={20} className="text-slate-500" />
            </div>
          </div>
        </button>
      </div>

      <p className="mt-12 text-slate-700 text-xs">v1.0 · 3 Pisos · 40 Mesas</p>
    </div>
  );
}
