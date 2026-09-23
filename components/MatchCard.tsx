'use client';

import React from 'react';
import { Match, getSafeLobby } from '../types/bracket';

interface MatchCardProps {
  match: Match;
  isHighlighted: boolean;
  isSelected?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
  onTeamHover?: (teamName: string | null) => void;
  showConnector?: boolean;
  connectorType?: 'up' | 'down' | 'straight';
  connectorStep?: number;
  isLosers?: boolean;
  placeholder1?: string;
  placeholder2?: string;
  isWBD?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isHighlighted,
  isSelected = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onTeamHover,
  showConnector = false,
  connectorType = 'straight',
  connectorStep = 1,
  isLosers = false,
  placeholder1 = 'TBD',
  placeholder2 = 'TBD',
  isWBD = false,
}) => {
  const lobby = getSafeLobby(match);
  const mpLink = lobby?.lobby_link || lobby?.osu_match_id;
  const t1 = match.team_1;
  const t2 = match.team_2;

  // Prioridad al nombre real, si no al placeholder
  const name1 = t1?.name || placeholder1;
  const name2 = t2?.name || placeholder2;

  const isP1Placeholder = !t1?.name;
  const isP2Placeholder = !t2?.name;

  const logo1 = t1?.logo_url || '/no-logo.png';
  const logo2 = t2?.logo_url || '/no-logo.png';

  // Lógica de puntajes
  let s1 = match.team_1_score ?? 0;
  let s2 = match.team_2_score ?? 0;

  // Lógica de Win By Default
  if (isWBD && match.winner_id) {
    if (match.winner_id === match.team_1_id) {
      s1 = 0;
      s2 = -1;
    } else if (match.winner_id === match.team_2_id) {
      s1 = -1;
      s2 = 0;
    }
  }

  const isForfeit =
    s1 === -1 ||
    s2 === -1 ||
    isWBD ||
    lobby?.status?.toLowerCase() === 'wbd' ||
    lobby?.status?.toLowerCase() === 'forfeit' ||
    lobby?.status?.toLowerCase() === 'ff';

  const estado = isForfeit ? 'FORFEIT' : (lobby?.status || 'SCHEDULED');

  // Variables de estilo
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
      className={`relative w-full group transition-all duration-300 cursor-pointer ${
        isHighlighted || isSelected ? 'z-30' : 'z-10'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Badges superiores: Match Order + Estado a la izquierda, MP Link a la derecha */}
      <div className="absolute -top-2.5 left-3 flex items-center gap-1.5 z-30">
        {match.match_order && (
          <div className="px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono tracking-wider bg-black/90 border border-white/20 text-zinc-300 shadow-md">
            #{match.match_order}
          </div>
        )}
        <div
          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-md ${
            estado.toUpperCase() === 'LIVE'
              ? 'bg-red-600 animate-pulse text-white'
              : isForfeit
              ? 'bg-amber-600 text-white border border-amber-400/40'
              : badgeColor
          }`}
        >
          {estado}
        </div>
      </div>

      {/* MP Link si está disponible */}
      {mpLink && (
        <a
          href={mpLink.startsWith('http') ? mpLink : `https://osu.ppy.sh/community/matches/${mpLink}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase z-30 shadow-md bg-black/90 border border-white/20 text-zinc-300 hover:text-[#fdc15a] hover:border-[#fdc15a] transition-all flex items-center gap-1.5"
          title="Ver MP Link en osu!"
        >
          <span>MP LINK</span>
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      <div
        className={`relative w-full bg-[#1a1a1a] border rounded-sm transition-all duration-300 z-20 overflow-hidden ${
          isSelected
            ? `${borderColor} ring-2 ring-white/30 scale-105 shadow-[0_0_25px_${shadowColor}]`
            : isHighlighted
            ? `${borderColor} scale-105 shadow-[0_0_20px_${shadowColor}]`
            : 'border-white/10 hover:border-white/30'
        }`}
      >
        <div className="flex flex-col">
          {/* Fila Equipo 1 */}
          <div
            className="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            onMouseEnter={() => t1?.name && onTeamHover?.(t1.name)}
            onMouseLeave={() => onTeamHover?.(null)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logo1}
                className={`w-6 h-6 object-contain flex-shrink-0 transition-opacity duration-300 ${
                  isP1Placeholder ? 'opacity-20 grayscale' : 'opacity-100'
                }`}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/no-logo.png';
                }}
              />
              {t1?.seed && (
                <span className="text-[10px] font-mono text-zinc-500 font-bold shrink-0">
                  #{t1.seed}
                </span>
              )}
              <span
                className={`font-['ITCMachine'] uppercase truncate transition-all duration-300 ${
                  s1 > s2
                    ? textColor
                    : isP1Placeholder
                    ? 'text-zinc-400 text-[12px]'
                    : 'text-zinc-300 text-[16px]'
                }`}
              >
                {name1}
              </span>
            </div>
            <span
              className={`font-black mr-3 text-[16px] flex-shrink-0 transition-colors duration-300 ${
                s1 > s2 ? textColor : s1 === -1 ? 'text-red-500' : 'text-zinc-400'
              }`}
            >
              {s1 === -1 ? 'FF' : s1}
            </span>
          </div>

          {/* Fila Equipo 2 */}
          <div
            className="flex justify-between items-center p-3 hover:bg-white/[0.02] transition-colors"
            onMouseEnter={() => t2?.name && onTeamHover?.(t2.name)}
            onMouseLeave={() => onTeamHover?.(null)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logo2}
                className={`w-6 h-6 object-contain flex-shrink-0 transition-opacity duration-300 ${
                  isP2Placeholder ? 'opacity-20 grayscale' : 'opacity-100'
                }`}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/no-logo.png';
                }}
              />
              {t2?.seed && (
                <span className="text-[10px] font-mono text-zinc-500 font-bold shrink-0">
                  #{t2.seed}
                </span>
              )}
              <span
                className={`font-['ITCMachine'] uppercase truncate transition-all duration-300 ${
                  s2 > s1
                    ? textColor
                    : isP2Placeholder
                    ? 'text-zinc-400 text-[12px]'
                    : 'text-zinc-300 text-[16px]'
                }`}
              >
                {name2}
              </span>
            </div>
            <span
              className={`font-black mr-3 text-[16px] flex-shrink-0 transition-colors duration-300 ${
                s2 > s1 ? textColor : s2 === -1 ? 'text-red-500' : 'text-zinc-400'
              }`}
            >
              {s2 === -1 ? 'FF' : s2}
            </span>
          </div>

          {/* Barra inferior reactiva */}
          <div
            className={`absolute bottom-0 left-0 w-full h-[2px] ${barColor} transition-transform duration-500 ${
              isHighlighted || isSelected ? 'scale-x-100' : 'scale-x-0'
            }`}
          ></div>
        </div>
      </div>

      {/* CONECTORES SVG */}
      {showConnector && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 w-32 overflow-visible pointer-events-none z-0">
          <svg width="128" height="1000" viewBox="0 0 128 1000" fill="none" className="overflow-visible">
            <path
              d={
                connectorType === 'straight'
                  ? `M 0 ${centerY} H 128`
                  : `M 0 ${centerY} H 64 V ${targetY} H 128`
              }
              stroke={isHighlighted || isSelected ? accentColor : '#444'}
              strokeWidth={isHighlighted || isSelected ? '3' : '2'}
              className="transition-all duration-300"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MatchCard;