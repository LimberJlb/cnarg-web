'use client';

import React, { useState, useMemo } from 'react';
import { Match, getSafeLobby } from '../types/bracket';

interface MatchHistorySidebarProps {
  matches: Match[] | null;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onMatchClick?: (matchId: string) => void;
}

function getMatchRelevance(match: Match, q: string): number {
  const stage = (match.stage || '').toLowerCase().trim();
  const t1 = (match.team_1?.name || '').toLowerCase().trim();
  const t2 = (match.team_2?.name || '').toLowerCase().trim();

  // 1. Coincidencia exacta de la etapa (ej: "FINALS" al buscar "finals")
  if (stage === q) return 100;

  // 2. La etapa empieza con el término de búsqueda (ej: "FINALS R1", "FINALS R2")
  if (stage.startsWith(q)) return 85;

  // 3. Coincidencia de palabra completa en la etapa (ej: "GRAND FINALS" al buscar "finals")
  const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`(^|\\s)${escapedQ}($|\\s)`, 'i');
  if (wordRegex.test(stage)) return 75;

  // 4. Coincidencia en nombre de equipo
  if (t1 === q || t2 === q) return 65;
  if (t1.startsWith(q) || t2.startsWith(q)) return 55;
  if (wordRegex.test(t1) || wordRegex.test(t2)) return 50;
  if (t1.includes(q) || t2.includes(q)) return 40;

  // 5. Coincidencia como subcadena en la etapa (ej: "QUARTERFINALS" o "SEMIFINALS" al buscar "finals")
  if (stage.includes(q)) return 20;

  return 0;
}

export default function MatchHistorySidebar({
  matches,
  activeId,
  onHover,
  onMatchClick,
}: MatchHistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado y ordenamiento inteligente por relevancia de búsqueda
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matches;

    return matches
      .map((m) => ({ match: m, score: getMatchRelevance(m, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        // Primero por relevancia de mayor a menor
        if (b.score !== a.score) return b.score - a.score;
        // Si tienen la misma relevancia, respetar el orden del match
        return (a.match.match_order || 0) - (b.match.match_order || 0);
      })
      .map((item) => item.match);
  }, [matches, searchQuery]);

  // Ordenamos y agrupamos los partidos por "stage" (Ronda) respetando la relevancia de búsqueda
  const groupedMatches = useMemo(() => {
    const list = searchQuery.trim()
      ? filteredMatches
      : filteredMatches.slice().sort((a, b) => (a.match_order || 0) - (b.match_order || 0));

    return list.reduce((acc, match) => {
      const stage = match.stage || 'TBD';
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(match);
      return acc;
    }, {} as Record<string, Match[]>);
  }, [filteredMatches, searchQuery]);

  return (
    <>
      {/* Overlay oscuro en móviles cuando el historial está abierto */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-[80px] bg-black/70 backdrop-blur-sm z-[65] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-[80px] bottom-0 md:bottom-12 left-0 z-[70] w-[85vw] max-w-xs sm:w-80 transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Contenedor principal del historial */}
        <div className="w-full bg-[#1a1a1a]/95 backdrop-blur-md p-4 border-r border-zinc-800 h-full flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="mb-4 pb-2 border-b border-zinc-700 flex items-center justify-between">
            <div>
              <h2 className="text-white font-['ITCMachine'] text-xl uppercase tracking-widest">
                Historial de Matches
              </h2>
              <span className="text-[10px] text-zinc-500 font-bold uppercase">
                {filteredMatches.length} partidos encontrados
              </span>
            </div>
            {/* Botón cerrar en móvil */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10"
              aria-label="Cerrar panel"
            >
              ✕
            </button>
          </div>

        {/* Buscador de equipos */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por equipo o ronda..."
            className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#fdc15a] transition-colors"
          />
        </div>

        {/* Lista de partidos con scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pl-2 pr-3.5 pb-12 flex flex-col gap-6">
          {Object.keys(groupedMatches).length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs uppercase font-bold">
              No se encontraron partidos
            </div>
          ) : (
            Object.entries(groupedMatches).map(([stage, stageMatches]) => {
              const isGroupLosers = stageMatches[0]?.bracket_group?.toLowerCase() === 'losers';
              const groupColorClass = isGroupLosers
                ? 'text-[#67a4da] border-[#67a4da]'
                : 'text-[#fdc15a] border-[#fdc15a]';

              return (
                <div key={stage} className="flex flex-col gap-3">
                  <h3
                    className={`text-[13px] font-black uppercase tracking-widest border-b pb-1 opacity-90 ${groupColorClass}`}
                  >
                    {stage}
                  </h3>

                  {stageMatches.map((match) => {
                    const isLosers = match.bracket_group?.toLowerCase() === 'losers';
                    const themeColor = isLosers ? '#67a4da' : '#fdc15a';
                    const themeShadow = isLosers
                      ? 'rgba(103,164,218,0.2)'
                      : 'rgba(252,193,90,0.2)';

                    const lobby = getSafeLobby(match);
                    const mpLink = lobby?.lobby_link;

                    let fechaStr = '---';
                    let horaStr = '--:--';
                    if (lobby?.match_time) {
                      try {
                        const date = new Date(lobby.match_time);
                        if (!isNaN(date.getTime())) {
                          fechaStr = date
                            .toLocaleDateString('es-AR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit',
                              timeZone: 'America/Argentina/Buenos_Aires',
                            })
                            .replace('.', '');
                          horaStr = date.toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'America/Argentina/Buenos_Aires',
                          });
                        }
                      } catch {
                        // fallback
                      }
                    }

                    const s1 = match.team_1_score ?? null;
                    const s2 = match.team_2_score ?? null;
                    const hasScore = s1 !== null && s2 !== null;

                    return (
                      <div
                        key={match.id}
                        onMouseEnter={() => onHover(match.id)}
                        onMouseLeave={() => onHover(null)}
                        onClick={() => onMatchClick?.(match.id)}
                        className="p-3.5 rounded-md transition-all duration-300 border cursor-pointer group relative"
                        style={{
                          backgroundColor: activeId === match.id ? '#27272a' : '#18181b',
                          borderColor: activeId === match.id ? themeColor : 'rgba(255, 255, 255, 0.1)',
                          boxShadow: activeId === match.id ? `0 0 15px ${themeShadow}` : 'none',
                          transform: activeId === match.id ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        {/* Header: Grupo, MP Link y Fecha */}
                        <div className="flex justify-between items-center text-[11px] mb-3 font-bold uppercase tracking-tighter">
                          <span
                            className={`transition-colors font-mono ${
                              activeId === match.id ? 'text-white' : 'text-zinc-500'
                            }`}
                          >
                            {match.match_order ? `#${match.match_order} • ` : ''}{isLosers ? 'Losers' : 'Winners'}
                          </span>
                          <div className="flex items-center gap-2">
                            {mpLink && (
                              <a
                                href={
                                  mpLink.startsWith('http')
                                    ? mpLink
                                    : `https://osu.ppy.sh/community/matches/${mpLink}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-zinc-500 hover:text-[#fdc15a] transition-colors p-0.5"
                                title="Ver MP Link"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            )}
                            <span style={{ color: themeColor }}>{fechaStr}</span>
                            <span className="text-white opacity-60">{horaStr} HS</span>
                          </div>
                        </div>

                        {/* Contenido: Equipos VS o Score */}
                        <div className="flex items-center justify-between gap-2 relative">
                          {/* TEAM 1 */}
                          <div className="flex flex-col items-center flex-1 overflow-hidden">
                            <img
                              src={match.team_1?.logo_url || '/no-logo.png'}
                              className={`w-8 h-8 mb-1 object-contain transition-transform duration-500 ${
                                activeId === match.id ? 'scale-110' : ''
                              }`}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/no-logo.png';
                              }}
                            />
                            <span
                              className={`text-[12px] font-bold text-center truncate w-full transition-colors ${
                                activeId === match.id ? 'text-white' : 'text-zinc-400'
                              }`}
                            >
                              {match.team_1?.name || 'TBD'}
                            </span>
                          </div>

                          {/* Centro: Score o VS */}
                          <div className="flex flex-col items-center justify-center px-2">
                            {hasScore ? (
                              <div className="flex items-center gap-1.5 font-['ITCMachine'] text-lg">
                                <span
                                  style={{ color: s1 > s2 ? themeColor : undefined }}
                                  className={s1 > s2 ? '' : 'text-zinc-400'}
                                >
                                  {s1}
                                </span>
                                <span className="text-zinc-600 text-xs">-</span>
                                <span
                                  style={{ color: s2 > s1 ? themeColor : undefined }}
                                  className={s2 > s1 ? '' : 'text-zinc-400'}
                                >
                                  {s2}
                                </span>
                              </div>
                            ) : (
                              <span
                                style={{ color: themeColor }}
                                className="font-black italic text-[12px] opacity-100 group-hover:opacity-100 transition-opacity"
                              >
                                VS
                              </span>
                            )}
                          </div>

                          {/* TEAM 2 */}
                          <div className="flex flex-col items-center flex-1 overflow-hidden">
                            <img
                              src={match.team_2?.logo_url || '/no-logo.png'}
                              className={`w-8 h-8 mb-1 object-contain transition-transform duration-500 ${
                                activeId === match.id ? 'scale-110' : ''
                              }`}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/no-logo.png';
                              }}
                            />
                            <span
                              className={`text-[12px] font-bold text-center truncate w-full transition-colors ${
                                activeId === match.id ? 'text-white' : 'text-zinc-400'
                              }`}
                            >
                              {match.team_2?.name || 'TBD'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Solapa Expansora que sobresale hacia la derecha */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 left-full -translate-y-1/2 w-[36px] sm:w-[45px] h-32 sm:h-44 bg-[#1a1a1a]/95 backdrop-blur-md border border-zinc-800 border-l-0 rounded-r-xl flex items-center justify-center cursor-pointer hover:bg-[#27272a] hover:w-[42px] sm:hover:w-[50px] transition-all duration-300 shadow-[5px_0_15px_rgba(0,0,0,0.5)] z-50"
        aria-label="Toggle Matches"
      >
        <span
          className="text-[#fdc15a] font-['ITCMachine'] tracking-[0.2em] uppercase whitespace-nowrap -rotate-90 select-none text-xs sm:text-base"
        >
          {isOpen ? 'CERRAR' : 'MATCHES'}
        </span>
      </button>
    </div>
  </>
);
}