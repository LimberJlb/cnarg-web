import React from 'react';

// 1. Definimos TODAS las propiedades que necesita la tarjeta
interface MatchCardProps {
  p1: string;
  p2: string;
  s1: number;
  s2: number;
  estado: string;
  onClick?: () => void; // Propiedad opcional para el clic
}

const MatchCard: React.FC<MatchCardProps> = ({ p1, p2, s1, s2, estado, onClick }) => {
  // Lógica para saber quién va ganando y resaltar el color
  const p1Gana = s1 > s2;
  const p2Gana = s2 > s1;

  return (
    <div 
      onClick={onClick}
      className="relative w-[220px] bg-[#1a1a1a] border border-white/10 rounded-sm shadow-2xl transition-all hover:border-[#fdc15a] cursor-pointer group overflow-hidden"
    >
      {/* Etiqueta de Estado (LIVE, UPCOMING, etc.) */}
      <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter z-10 shadow-lg
        ${estado === 'LIVE' ? 'bg-red-600 animate-pulse text-white' : 
          estado === 'FINALIZED' ? 'bg-gray-600 text-white' : 'bg-[#fdc15a] text-[#2e2e2e]'}
      `}>
        {estado}
      </div>

      <div className="flex flex-col">
        {/* JUGADOR 1 */}
        <div className={`flex justify-between items-center p-3 border-b border-white/5 ${p1Gana ? 'bg-[#fdc15a]/5' : ''}`}>
          <span className={`font-['ITCMachine'] text-[13px] uppercase truncate pr-2 ${p1Gana ? 'text-[#fdc15a]' : 'text-gray-400'}`}>
            {p1 || 'TBD'}
          </span>
          <span className={`font-black text-[15px] min-w-[24px] text-center ${p1Gana ? 'text-[#fdc15a]' : 'text-gray-500'}`}>
            {s1}
          </span>
        </div>

        {/* JUGADOR 2 */}
        <div className={`flex justify-between items-center p-3 ${p2Gana ? 'bg-[#fdc15a]/5' : ''}`}>
          <span className={`font-['ITCMachine'] text-[13px] uppercase truncate pr-2 ${p2Gana ? 'text-[#fdc15a]' : 'text-gray-400'}`}>
            {p2 || 'TBD'}
          </span>
          <span className={`font-black text-[15px] min-w-[24px] text-center ${p2Gana ? 'text-[#fdc15a]' : 'text-gray-500'}`}>
            {s2}
          </span>
        </div>
      </div>

      {/* Detalle visual: una barrita dorada que se ilumina al pasar el mouse */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#fdc15a] scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </div>
  );
};

export default MatchCard;