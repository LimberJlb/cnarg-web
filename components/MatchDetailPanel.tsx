'use client';

import React, { useState } from 'react';
import { Match, getSafeLobby } from '../types/bracket';
import { MATCH_META } from '../lib/bracketConfig';

interface MatchDetailPanelProps {
  match: Match | null;
  isPinned?: boolean;
  onClose?: () => void;
}

export default function MatchDetailPanel({ match, isPinned, onClose }: MatchDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!match) return null;

  const lobby = getSafeLobby(match);
  if (!lobby) return null;
  const mpLink = lobby.lobby_link || lobby.osu_match_id;

  const meta = match.match_order ? MATCH_META[match.match_order] : null;

  const isLosers = match.bracket_group?.toLowerCase() === 'losers';
  const colorClass = isLosers ? 'text-[#67a4da]' : 'text-[#fdc15a]';
  const borderColor = isLosers ? 'border-[#67a4da]' : 'border-[#fdc15a]';
  const accentBg = isLosers ? 'bg-[#67a4da]/10' : 'bg-[#fdc15a]/10';
  const badgeBg = isLosers ? 'bg-[#67a4da] text-black' : 'bg-[#fdc15a] text-[#2e2e2e]';

  let fechaStr = 'FECHA TBD';
  let horaStr = '--:--';

  if (lobby.match_time) {
    try {
      const date = new Date(lobby.match_time);
      if (!isNaN(date.getTime())) {
        fechaStr = date.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'long',
          timeZone: 'America/Argentina/Buenos_Aires',
        });
        horaStr = date.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/Argentina/Buenos_Aires',
        });
      }
    } catch {
      // Fallback
    }
  }

  const s1 = match.team_1_score ?? 0;
  const s2 = match.team_2_score ?? 0;

  const isForfeit =
    s1 === -1 ||
    s2 === -1 ||
    lobby.status?.toLowerCase() === 'wbd' ||
    lobby.status?.toLowerCase() === 'forfeit';

  const isFinished =
    lobby.status?.toLowerCase() === 'finished' ||
    isForfeit ||
    s1 > 0 ||
    s2 > 0;

  const team1Won = s1 > s2;
  const team2Won = s2 > s1;

  // Extraer ID de la partida multijugador para mostrarlo y copiarlo
  let mpId = lobby.osu_match_id || '';
  if (!mpId && lobby.lobby_link) {
    const matched = lobby.lobby_link.match(/matches\/(\d+)|mp\/(\d+)/);
    if (matched) mpId = matched[1] || matched[2] || '';
  }

  const handleCopyMp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = mpId ? mpId : mpLink || '';
    if (textToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`fixed md:absolute bottom-0 md:bottom-6 left-0 md:left-auto right-0 md:right-6 z-[300] w-full md:w-[calc(100vw-2rem)] md:max-w-[540px] max-h-[85dvh] md:max-h-[90vh] bg-[#0c0c0c]/98 border-t-2 md:border-2 ${borderColor} rounded-t-2xl md:rounded-sm shadow-[0_-10px_35px_rgba(0,0,0,0.95)] md:shadow-[0_0_35px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden select-none animate-in fade-in slide-in-from-bottom-6 md:slide-in-from-right-10 duration-300 backdrop-blur-3xl`}
    >
      {/* Barra de arrastre/cierre táctil para celulares */}
      <div 
        className="md:hidden w-full flex items-center justify-center py-2 bg-black/60 border-b border-white/5 cursor-pointer shrink-0"
        onClick={onClose}
        title="Toca para cerrar"
      >
        <div className="w-12 h-1 bg-white/30 rounded-full" />
      </div>

      {/* HEADER */}
      <div className={`p-3.5 sm:p-4 ${accentBg} border-b border-white/10 flex justify-between items-center relative shrink-0`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest">
              CNARG 2026
            </span>
            {match.match_order && (
              <span className="px-1.5 py-0.2 rounded bg-black/60 border border-white/20 text-zinc-300 text-[10px] font-mono font-black">
                MATCH #{match.match_order}
              </span>
            )}
            {isForfeit && (
              <span className="px-1.5 py-0.2 rounded bg-amber-600/90 text-white text-[10px] font-black uppercase">
                FORFEIT
              </span>
            )}
            {isPinned && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${badgeBg}`}>
                FIJADO
              </span>
            )}
          </div>
          <h3 className={`font-['ITCMachine'] ${colorClass} text-xl sm:text-2xl uppercase leading-tight tracking-widest mt-0.5`}>
            {match.stage || 'STAGE'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white font-bold text-xs uppercase">{fechaStr}</p>
            <p className={`${colorClass} font-black text-[10px] sm:text-[11px] uppercase`}>{horaStr} HS (ARG)</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center w-8 h-8"
              title="Cerrar panel"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* MARCADOR CENTRAL Y ESTADO DE VICTORIA */}
      <div className="px-6 py-4 bg-black/70 border-b border-white/10 flex items-center justify-between">
        {/* Indicador Victoria Equipo 1 */}
        <div className="flex-1 flex justify-start items-center">
          {team1Won && isFinished ? (
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md ${badgeBg}`}>
              VICTORIA
            </div>
          ) : (
            <div className="w-16"></div>
          )}
        </div>

        {/* Marcador Central */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span
              className={`font-['ITCMachine'] text-4xl tracking-wider transition-colors ${
                team1Won ? colorClass : 'text-zinc-400'
              }`}
            >
              {s1 === -1 ? 'FF' : s1}
            </span>
            <span className="text-zinc-600 font-['ITCMachine'] text-2xl">-</span>
            <span
              className={`font-['ITCMachine'] text-4xl tracking-wider transition-colors ${
                team2Won ? colorClass : 'text-zinc-400'
              }`}
            >
              {s2 === -1 ? 'FF' : s2}
            </span>
          </div>
          {meta && (
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest mt-1">
              FIRST TO {meta.firstTo} • BEST OF {meta.bestOf}
            </span>
          )}
        </div>

        {/* Indicador Victoria Equipo 2 */}
        <div className="flex-1 flex justify-end items-center">
          {team2Won && isFinished ? (
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md ${badgeBg}`}>
              VICTORIA
            </div>
          ) : (
            <div className="w-16"></div>
          )}
        </div>
      </div>

      {/* ROSTERS ESPEJADOS */}
      <div className="p-6 flex justify-between gap-6 relative max-h-[310px] overflow-y-auto custom-scrollbar">
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] font-['ITCMachine'] text-9xl italic ${colorClass}`}
        >
          VS
        </div>

        {/* TEAM 1 */}
        <div className="flex-1 flex flex-col items-start z-10">
          <div className="flex items-center gap-3 mb-5 w-full">
            <img
              src={match.team_1?.logo_url || '/no-logo.png'}
              className="w-10 h-10 object-contain drop-shadow-lg shrink-0"
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/no-logo.png';
              }}
            />
            <div className="flex flex-col min-w-0">
              {match.team_1?.seed && (
                <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                  SEED #{match.team_1.seed}
                </span>
              )}
              <h4
                className={`font-['ITCMachine'] text-lg uppercase truncate ${
                  team1Won ? colorClass : 'text-white'
                }`}
              >
                {match.team_1?.name || 'TBD'}
              </h4>
            </div>
          </div>
          <div className="space-y-3.5 w-full">
            {match.team_1?.players?.slice(0, 5).map((p, i) => (
              <a
                key={i}
                href={p.osu_id ? `https://osu.ppy.sh/users/${p.osu_id}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
              >
                <div className={`w-10 h-10 rounded-full border-2 ${borderColor} overflow-hidden bg-zinc-900 shrink-0`}>
                  <img
                    src={p.avatar_url || (p.osu_id ? `https://a.ppy.sh/${p.osu_id}` : '/no-avatar.png')}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/no-avatar.png';
                    }}
                  />
                </div>
                <span className="text-[14px] text-zinc-200 font-bold tracking-tight truncate group-hover:text-white">
                  {p.nickname}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* TEAM 2 */}
        <div className="flex-1 flex flex-col items-end z-10">
          <div className="flex items-center gap-3 mb-5 w-full justify-end">
            <div className="flex flex-col items-end min-w-0">
              {match.team_2?.seed && (
                <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider text-right">
                  SEED #{match.team_2.seed}
                </span>
              )}
              <h4
                className={`font-['ITCMachine'] text-lg uppercase truncate text-right ${
                  team2Won ? colorClass : 'text-white'
                }`}
              >
                {match.team_2?.name || 'TBD'}
              </h4>
            </div>
            <img
              src={match.team_2?.logo_url || '/no-logo.png'}
              className="w-10 h-10 object-contain drop-shadow-lg shrink-0"
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/no-logo.png';
              }}
            />
          </div>
          <div className="space-y-3.5 w-full">
            {match.team_2?.players?.slice(0, 5).map((p, i) => (
              <a
                key={i}
                href={p.osu_id ? `https://osu.ppy.sh/users/${p.osu_id}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group justify-end hover:opacity-80 transition-opacity"
              >
                <span className="text-[14px] text-zinc-200 font-bold tracking-tight truncate text-right group-hover:text-white">
                  {p.nickname}
                </span>
                <div className={`w-10 h-10 rounded-full border-2 ${borderColor} overflow-hidden bg-zinc-900 shrink-0`}>
                  <img
                    src={p.avatar_url || (p.osu_id ? `https://a.ppy.sh/${p.osu_id}` : '/no-avatar.png')}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/no-avatar.png';
                    }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* BANS Y PROTECTS (Si existen en meta) */}
      {meta && (meta.protects.length > 0 || meta.bans.length > 0) && (
        <div className="px-6 py-2.5 bg-black/60 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {meta.protects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                PROTECTS
              </span>
              <div className="flex items-center gap-1.5">
                {meta.protects.map((mapSlot) => (
                  <span
                    key={mapSlot}
                    className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-[11px]"
                  >
                    {mapSlot}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meta.bans.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                BANS
              </span>
              <div className="flex items-center gap-1.5">
                {meta.bans.map((mapSlot) => (
                  <span
                    key={mapSlot}
                    className="px-2 py-0.5 rounded bg-red-950/70 border border-red-500/30 text-red-300 font-bold font-mono text-[11px]"
                  >
                    {mapSlot}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MP LINK BAR (Si está disponible) */}
      {mpLink && (
        <div className="bg-white/[0.03] py-2 px-6 flex justify-between items-center border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
              SALA MULTIJUGADOR
            </span>
            {mpId && (
              <span className="font-mono text-[11px] text-zinc-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                #{mpId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {mpId && (
              <button
                onClick={handleCopyMp}
                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/5'
                }`}
                title="Copiar ID de la sala"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>COPIADO</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>COPIAR ID</span>
                  </>
                )}
              </button>
            )}
            <a
              href={mpLink.startsWith('http') ? mpLink : `https://osu.ppy.sh/community/matches/${mpLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-['ITCMachine'] tracking-wider ${colorClass} hover:underline flex items-center gap-1.5`}
            >
              <span>VER EN OSU!</span>
              <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* STREAMING BAR */}
      <a
        href="https://twitch.tv/cnarg_4k"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white/[0.05] py-2.5 flex justify-center items-center gap-2.5 border-t border-white/5 hover:bg-white/[0.1] transition-colors group"
      >
        <svg className="w-4 h-4 fill-[#a970ff] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
        </svg>
        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]"></div>
        <span className={`font-['ITCMachine'] text-base tracking-[0.1em] ${colorClass}`}>
          TWITCH.TV/CNARG_4K
        </span>
      </a>

      {/* STAFF FOOTER */}
      <div className="bg-black/50 p-3 flex justify-between items-center gap-2 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">REFEREE</span>
          <span className="text-xs text-white font-black tracking-tight">{lobby.referee?.nickname || 'Por confirmar'}</span>
        </div>

        <div className="flex flex-col items-center text-center px-4 border-x border-white/10 flex-1">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">CASTERS</span>
          <div className="flex flex-col">
            <span className="text-xs text-white font-black leading-tight tracking-tight">{lobby.caster_1?.nickname || 'Por confirmar'}</span>
            {lobby.caster_2 && <span className="text-xs text-white font-black leading-tight tracking-tight uppercase">{lobby.caster_2.nickname}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">STREAMER</span>
          <span className="text-xs text-white font-black tracking-tight">{lobby.streamer?.nickname || 'Por confirmar'}</span>
        </div>
      </div>

      <div className={`h-2 w-full ${isLosers ? 'bg-[#67a4da]' : 'bg-[#fdc15a]'}`}></div>
    </div>
  );
}
