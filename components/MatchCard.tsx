'use client';
import React, { useState } from 'react';

interface MatchCardProps {
  match: any;
  p1: string;
  p2: string;
  logo1?: string | null;
  logo2?: string | null;
  s1: number;
  s2: number;
  estado: string;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  showConnector?: boolean; 
  connectorType?: 'up' | 'down' | 'straight';
  isLosers?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, p1, p2, logo1, logo2, s1, s2, estado, 
  isHighlighted, onMouseEnter, onMouseLeave,
  showConnector = false,
  connectorType = 'straight',
  isLosers = false
}) => {
  const [isLocalHover, setIsLocalHover] = useState(false);
  const lobby = match.lobbies?.[0];

  // --- VARIABLES DE ESTILO (Aquí estaba el error) ---
  const borderColor = isLosers ? 'border-[#67a4da]' : 'border-[#fdc15a]';
  const shadowColor = isLosers ? 'rgba(103,164,218,0.4)' : 'rgba(252,193,90,0.4)';
  const barColor = isLosers ? 'bg-[#67a4da]' : 'bg-[#fdc15a]';
  const badgeColor = isLosers ? 'bg-[#67a4da] text-black' : 'bg-[#fdc15a] text-[#2e2e2e]';
  
  // Agregamos esta que faltaba:
  const textColor = isLosers ? 'text-[#67a4da]' : 'text-[#fdc15a]';

  return (
    <div 
      className="relative w-full group"
      onMouseEnter={() => { setIsLocalHover(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setIsLocalHover(false); onMouseLeave?.(); }}
    >
      {/* CUADRO MÁS ANCHO: w-[280px] para ocupar toda la columna */}
      <div className={`relative w-full bg-[#1a1a1a] border rounded-sm transition-all duration-300 z-20 overflow-hidden
        ${isHighlighted ? `${borderColor} scale-105 shadow-[0_0_20px_${shadowColor}]` : 'border-white/10'}
      `}>
        <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase z-10
          ${estado === 'LIVE' ? 'bg-red-600 animate-pulse text-white' : badgeColor}
        `}>
          {estado}
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <div className="flex items-center gap-4">
              <img src={logo1 || '/no-logo.png'} className="w-6 h-6 object-contain" alt="" />
              <span className={`font-['ITCMachine'] text-[16px] uppercase ${s1 > s2 ? textColor : 'text-gray-400'}`}>
                {p1}
              </span>
            </div>
            <span className="font-black mr-4 text-[16px]">{s1}</span>
          </div>
          <div className="flex justify-between items-center p-3">
            <div className="flex items-center gap-4">
              <img src={logo2 || '/no-logo.png'} className="w-6 h-6 object-contain" alt="" />
              <span className={`font-['ITCMachine'] text-[16px] uppercase ${s2 > s1 ? textColor : 'text-gray-400'}`}>
                {p2}
              </span>
            </div>
            <span className="font-black mr-4 text-[16px]">{s2}</span>
          </div>
          <div className={`absolute bottom-0 left-0 w-full h-[2px] ${barColor} transition-transform duration-500 ${isHighlighted ? 'scale-x-100' : 'scale-x-0'}`}></div>
        </div>     
      </div>

      {/* CONECTORES: Ahora de 128px para que lleguen sí o sí */}
      {showConnector && (
        <div className="absolute left-full top-[50%] -translate-y-1/2 w-32 overflow-visible pointer-events-none z-0">
          <svg width="128" height="400" viewBox="0 0 128 400" fill="none" className="drop-shadow-[0_0_8px_rgba(253,193,90,0.2)]">
            {connectorType === 'down' && (
              <path d="M0 200 H64 V280 H128" stroke={isHighlighted ? (isLosers ? "#67a4da" : "#fdc15a") : "#444"} strokeWidth={isHighlighted ? "3" : "2"} className="transition-all duration-300" />
            )}
            {connectorType === 'up' && (
              <path d="M0 200 H64 V120 H128" stroke={isHighlighted ? (isLosers ? "#67a4da" : "#fdc15a") : "#444"} strokeWidth={isHighlighted ? "3" : "2"} className="transition-all duration-300" />
            )}
            {connectorType === 'straight' && (
              <path d="M0 200 H128" stroke={isHighlighted ? (isLosers ? "#67a4da" : "#fdc15a") : "#444"} strokeWidth={isHighlighted ? "3" : "2"} className="transition-all duration-300" />
            )}
          </svg>
        </div>
      )}

      {/* TOOLTIP: Aquí es donde fallaba por falta de 'textColor' */}
      {(isLocalHover || isHighlighted) && lobby && (
        <div className="absolute left-[110%] top-0 z-[100] w-64 bg-[#141414] border border-[#fdc15a] p-4 rounded-md shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200">
          <p className={`${textColor} font-['ITCMachine'] text-[14px] mb-2 border-b border-white/10 pb-1 uppercase`}>DATOS DEL LOBBY</p>
          <div className="space-y-1 text-[14px]">
            <p><span className="text-zinc-500">Referee:</span> {lobby.referee?.nickname || '---'}</p>
            <p><span className="text-zinc-500">Casters:</span> {lobby.caster1?.nickname} {lobby.caster2 ? `& ${lobby.caster2.nickname}` : ''}</p>
            <p><span className="text-zinc-500">Streamer:</span> {lobby.streamer?.nickname || '---'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;