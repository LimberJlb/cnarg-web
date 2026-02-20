// src/components/BracketSelectorBtn.tsx
import React from 'react';

interface BracketSelectorBtnProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant: 'winners' | 'losers'; // Para decidir el color
}

const BracketSelectorBtn: React.FC<BracketSelectorBtnProps> = ({
  label,
  isActive,
  onClick,
  variant
}) => {
  // 1. Definimos los colores según la variante (Winners=Dorado, Losers=Celeste)
  const isGold = variant === 'winners';
  const mainColorStr = isGold ? '#fdc15a' : '#67a4da';
  const shadowColorStr = isGold ? 'rgba(252,193,90,0.5)' : 'rgba(103,164,218,0.5)';

  // Clases dinámicas de Tailwind
  const activeClasses = isActive
    ? `bg-[${mainColorStr}] text-[#2e2e2e] shadow-[0_0_20px_${shadowColorStr}] scale-105`
    : `bg-black/40 text-white/70 border border-white/10 hover:border-[${mainColorStr}] hover:text-[${mainColorStr}]`;

  const hoverClasses = `hover:scale-110 hover:shadow-[0_0_25px_${shadowColorStr}]`;
  const barColorClass = isGold ? 'bg-[#fdc15a]' : 'bg-[#67a4da]';

  return (
    <button
      onClick={onClick}
      // 'group' es necesario para que la barrita de abajo reaccione al hover del botón
      className={`
        relative px-10 py-3 font-['ITCMachine'] text-xl rounded-sm overflow-hidden transition-all duration-300 group
        ${activeClasses}
        ${!isActive ? hoverClasses : ''} /* Solo aplicamos efecto hover exagerado si NO está activo */
      `}
    >
      <span className="relative z-10">{label}</span>
      
      {/* La barrita inferior animada (igual que en MatchCard) */}
      <div className={`absolute bottom-0 left-0 w-full h-[3px] ${barColorClass} transition-transform duration-300 scale-x-0 group-hover:scale-x-100 origin-left`}></div>
    </button>
  );
};

export default BracketSelectorBtn;