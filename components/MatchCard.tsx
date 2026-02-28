'use client';
import React, { useState } from 'react';

// 1. Agregamos placeholder1 y placeholder2 a las props
interface MatchCardProps {
  match: any;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  showConnector?: boolean; 
  connectorType?: 'up' | 'down' | 'straight';
  connectorStep?: number;
  isLosers?: boolean;
  placeholder1?: string; // <--- NUEVA PROP
  placeholder2?: string; // <--- NUEVA PROP
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  isHighlighted, onMouseEnter, onMouseLeave,
  showConnector = false,
  connectorType = 'straight',
  connectorStep = 1,
  isLosers = false,
  placeholder1 = "TBD", // Valor por defecto
  placeholder2 = "TBD"  // Valor por defecto
}) => {
  const [isLocalHover, setIsLocalHover] = useState(false);
  
  const lobby = match.lobbies?.[0];
  const t1 = match.team_1;
  const t2 = match.team_2;
  
  // Lógica de nombres: Prioridad al nombre real, si no, al placeholder
  const name1 = t1?.name || placeholder1;
  const name2 = t2?.name || placeholder2;

  // Detectamos si es un placeholder para aplicar estilos diferentes
  const isP1Placeholder = !t1?.name;
  const isP2Placeholder = !t2?.name;

  const logo1 = t1?.logo_url || "/no-logo.png";
  const logo2 = t2?.logo_url || "/no-logo.png";

  const s1 = match.results?.filter((r: any) => r.map_winner_id === match.team_1_id).length || 0;
  const s2 = match.results?.filter((r: any) => r.map_winner_id === match.team_2_id).length || 0;
  
  const estado = lobby?.status || 'SCHEDULED';

  // --- VARIABLES DE ESTILO ---
  const accentColor = isLosers ? '#67a4da' : '#fdc15a';
  const borderColor = isLosers ? 'border-[#67a4da]' : 'border-[#fdc15a]';
  const shadowColor = isLosers ? 'rgba(103,164,218,0.4)' : 'rgba(252,193,90,0.4)';
  const barColor = isLosers ? 'bg-[#67a4da]' : 'bg-[#fdc15a]';
  const badgeColor = isLosers ? 'bg-[#67a4da] text-black' : 'bg-[#fdc15a] text-[#2e2e2e]';
  const textColor = isLosers ? 'text-[#67a4da]' : 'text-[#fdc15a]';

  const centerY = 500;
  const verticalOffset = 100 * connectorStep;
  const targetY = connectorType === 'down' ? centerY + verticalOffset : centerY - verticalOffset;

  return (
    <div 
      id={`match-${match.id}`}
      className={`relative w-full group transition-all duration-300 ${isHighlighted || isLocalHover ? 'z-[100]' : 'z-10'}`}
      onMouseEnter={() => { setIsLocalHover(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setIsLocalHover(false); onMouseLeave?.(); }}
    >
      <div className={`relative w-full bg-[#1a1a1a] border rounded-sm transition-all duration-300 z-20 overflow-hidden
        ${isHighlighted ? `${borderColor} scale-105 shadow-[0_0_20px_${shadowColor}]` : 'border-white/10'}
      `}>
        <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase z-10
          ${estado.toUpperCase() === 'LIVE' ? 'bg-red-600 animate-pulse text-white' : badgeColor}
        `}>
          {estado}
        </div>

        <div className="flex flex-col">
          {/* Fila Equipo 1 */}
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <div className="flex items-center gap-4">
              <img 
                src={logo1} 
                className={`w-6 h-6 object-contain transition-opacity duration-300 ${isP1Placeholder ? 'opacity-20 grayscale' : 'opacity-100'}`} 
                alt="" 
              />
              <span className={`font-['ITCMachine'] uppercase transition-all duration-300 
                ${s1 > s2 ? textColor : isP1Placeholder ? 'text-zinc-400 text-[12px]' : 'text-gray-400 text-[16px]'}`}>
                {name1}
              </span>
            </div>
            <span className={`font-black mr-4 text-[16px] transition-colors duration-300 ${s1 > s2 ? textColor : 'text-zinc-500'}`}>
              {s1}
            </span>
          </div>

          {/* Fila Equipo 2 */}
          <div className="flex justify-between items-center p-3">
            <div className="flex items-center gap-4">
              <img 
                src={logo2} 
                className={`w-6 h-6 object-contain transition-opacity duration-300 ${isP2Placeholder ? 'opacity-20 grayscale' : 'opacity-100'}`} 
                alt="" 
              />
              <span className={`font-['ITCMachine'] uppercase transition-all duration-300 
                ${s2 > s1 ? textColor : isP2Placeholder ? 'text-zinc-400 text-[12px]' : 'text-gray-400 text-[16px]'}`}>
                {name2}
              </span>
            </div>
            <span className={`font-black mr-4 text-[16px] transition-colors duration-300 ${s2 > s1 ? textColor : 'text-zinc-500'}`}>
              {s2}
            </span>
          </div>
          
          <div className={`absolute bottom-0 left-0 w-full h-[2px] ${barColor} transition-transform duration-500 ${isHighlighted ? 'scale-x-100' : 'scale-x-0'}`}></div>
        </div>     
      </div>

      {/* CONECTORES */}
      {showConnector && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 w-32 overflow-visible pointer-events-none z-0">
          <svg width="128" height="1000" viewBox="0 0 128 1000" fill="none" className="overflow-visible">
            <path 
              d={
                connectorType === 'straight' 
                  ? `M 0 ${centerY} H 128`
                  : `M 0 ${centerY} H 64 V ${targetY} H 128`
              }
              stroke={isHighlighted ? accentColor : "#444"} 
              strokeWidth={isHighlighted ? "3" : "2"} 
              className="transition-all duration-300" 
            />
          </svg>
        </div>
      )}

      {/* TOOLTIP (Se oculta si no hay lobby o si es placeholder para no ensuciar) */}
      {(isLocalHover || isHighlighted) && lobby && !isP1Placeholder && !isP2Placeholder && (
        <div className={`absolute left-[102%] top-0 z-[110] w-64 bg-black border-2 ${borderColor} p-4 rounded-sm shadow-[10px_0_40px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in duration-200 backdrop-blur-md`}>
          <p className={`${textColor} font-['ITCMachine'] text-[14px] mb-3 border-b border-white/10 pb-1 uppercase tracking-widest`}>
            Staff Details
          </p>
          <div className="space-y-2 text-[13px] text-white">
            <div className="flex justify-between">
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Referee</span>
              <span className="font-bold">{lobby.referee?.nickname || 'TBD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Streamer</span>
              <span className="font-bold">{lobby.streamer?.nickname || 'TBD'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;