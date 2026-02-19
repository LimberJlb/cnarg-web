import React from 'react';

const MatchModal = ({ match, onClose }: any) => {
  if (!match) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Contenedor de la Card */}
      <div className="bg-[#1a1a1a] border-2 border-[#fdc15a] w-full max-w-2xl rounded-sm overflow-hidden shadow-[0_0_50px_rgba(253,193,90,0.2)]">
        
        {/* Cabecera: Fecha y Botón cerrar */}
        <div className="bg-[#fdc15a] p-4 flex justify-between items-center">
          <span className="font-['ITCMachine'] text-[#2e2e2e] text-xl uppercase italic">Detalles del Encuentro</span>
          <button onClick={onClose} className="text-[#2e2e2e] font-black text-2xl hover:scale-110 transition-transform px-2">✕</button>
        </div>

        <div className="p-8">
          {/* Fila 1: Horario y Fecha */}
          <div className="grid grid-cols-2 gap-8 mb-10 border-b border-white/5 pb-6">
            <div>
              <p className="text-[#fdc15a] text-[10px] uppercase tracking-[0.3em] mb-1">FECHA</p>
              <p className="font-['ITCMachine'] text-2xl">{match.fecha || '20/02/2026'}</p>
            </div>
            <div>
              <p className="text-[#fdc15a] text-[10px] uppercase tracking-[0.3em] mb-1">HORARIO</p>
              <p className="font-['ITCMachine'] text-2xl">{match.hora || '18:00 UTC'}</p>
            </div>
          </div>

          {/* Fila 2: Staff */}
          <div className="grid grid-cols-2 gap-8 mb-10 border-b border-white/5 pb-6">
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">REFEREE</p>
              <p className="font-bold text-white uppercase italic">{match.referee || 'Sin asignar'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">CASTER</p>
              <p className="font-bold text-white uppercase italic">{match.caster1 || 'Sin asignar'}</p>
            </div>
          </div>

          {/* Fila 3: Miembros de Equipo */}
          <div className="grid grid-cols-2 gap-10">
            {/* Equipo 1 */}
            <div className="space-y-3">
              <p className="text-[#fdc15a] font-['ITCMachine'] border-l-4 border-[#fdc15a] pl-3 uppercase">Equipo 1</p>
              <div className="bg-black/30 p-4 rounded-sm">
                <p className="text-white text-sm font-bold uppercase">{match.p1_m1 || 'Jugador 1'}</p>
                <p className="text-white text-sm font-bold uppercase">{match.p1_m2 || 'Jugador 2'}</p>
              </div>
            </div>
            {/* Equipo 2 */}
            <div className="space-y-3 text-right">
              <p className="text-[#67a4da] font-['ITCMachine'] border-r-4 border-[#67a4da] pr-3 uppercase">Equipo 2</p>
              <div className="bg-black/30 p-4 rounded-sm">
                <p className="text-white text-sm font-bold uppercase">{match.p2_m1 || 'Jugador 3'}</p>
                <p className="text-white text-sm font-bold uppercase">{match.p2_m2 || 'Jugador 4'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;