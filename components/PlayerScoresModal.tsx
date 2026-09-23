'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  PlayerFullTournamentStats,
  PlayerBasicInfo,
  fetchPlayerTournamentStats,
  fetchAllTournamentPlayers,
  PlayerBracketMatchGroup,
  PlayerQualifierStat,
} from '../lib/playerScores';

interface PlayerScoresModalProps {
  playerId: string | null;
  onClose: () => void;
  onSelectPlayer?: (playerId: string) => void;
}

const getPatternColor = (pattern: string) => {
  switch (pattern?.toUpperCase()) {
    case 'RC':
      return { bg: 'bg-[#70ade3]/20', border: 'border-[#70ade3]/40', text: 'text-[#70ade3]', bar: '#70ade3' };
    case 'LN':
      return { bg: 'bg-[#ff4d4d]/20', border: 'border-[#ff4d4d]/40', text: 'text-[#ff4d4d]', bar: '#ff4d4d' };
    case 'HB':
      return { bg: 'bg-[#ff9933]/20', border: 'border-[#ff9933]/40', text: 'text-[#ff9933]', bar: '#ff9933' };
    case 'SV':
      return { bg: 'bg-[#008000]/20', border: 'border-[#008000]/40', text: 'text-[#48bb78]', bar: '#008000' };
    case 'TB':
      return { bg: 'bg-[#800080]/20', border: 'border-[#800080]/40', text: 'text-[#d6bcfa]', bar: '#800080' };
    default:
      return { bg: 'bg-[#fdc15a]/20', border: 'border-[#fdc15a]/40', text: 'text-[#fdc15a]', bar: '#fdc15a' };
  }
};

export default function PlayerScoresModal({
  playerId,
  onClose,
  onSelectPlayer,
}: PlayerScoresModalProps) {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<PlayerFullTournamentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'qualifiers' | 'brackets'>('resumen');
  const [allPlayers, setAllPlayers] = useState<PlayerBasicInfo[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar lista completa de jugadores para el selector rápido
  useEffect(() => {
    fetchAllTournamentPlayers().then(setAllPlayers);
  }, []);

  // Cargar datos del jugador actual
  useEffect(() => {
    if (!playerId) {
      setStats(null);
      return;
    }

    let isCurrent = true;
    setLoading(true);

    fetchPlayerTournamentStats(playerId).then((data) => {
      if (isCurrent) {
        setStats(data);
        setLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [playerId]);

  // Manejo de la tecla Escape y bloqueo de scroll en el fondo
  useEffect(() => {
    if (!playerId) return;

    // Bloquear scroll de la página de fondo para evitar que aparezcan 2 barras de scroll
    const originalBodyOverflow = document.body.style.overflow;
    const mains = document.querySelectorAll('main');
    const prevMainOverflows: string[] = [];
    mains.forEach((m) => {
      prevMainOverflows.push(m.style.overflow);
      m.style.overflow = 'hidden';
    });

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      mains.forEach((m, i) => {
        m.style.overflow = prevMainOverflows[i] || '';
      });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerId, onClose]);

  // Resetear el scroll interior al cambiar de pestaña
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Si no está montado en cliente o no hay jugador o document.body, no renderizar
  if (!mounted || !playerId || typeof document === 'undefined' || !document.body) return null;

  const player = stats?.player;
  const placement = stats?.placement;
  const metrics = stats?.metrics;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#141414] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col h-[90vh] sm:h-[86vh] max-h-[820px] min-h-[580px] text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Línea decorativa dorada superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#fdc15a]/20 via-[#fdc15a] to-[#fdc15a]/20"></div>

        {/* CABECERA PRINCIPAL */}
        <div className="p-4 sm:p-6 bg-[#1a1a1a]/80 border-b border-white/5 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Foto, Nickname, Equipo y Podio */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              {/* Avatar con enlace a osu! */}
              <a
                href={player?.osu_id ? `https://osu.ppy.sh/users/${player.osu_id}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group shrink-0"
                title="Ver perfil oficial en osu!"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border-2 border-white/10 group-hover:border-[#fdc15a] overflow-hidden shadow-lg transition-colors">
                  <img
                    src={
                      player?.avatar_url ||
                      (player?.osu_id ? `https://a.ppy.sh/${player.osu_id}` : '/no-avatar.png')
                    }
                    alt={player?.nickname || ''}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/no-avatar.png';
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black text-[#fdc15a] uppercase font-mono">
                    OSU! ↗
                  </span>
                </div>
              </a>

              {/* Textos de Perfil */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-['ITCMachine'] text-2xl sm:text-3xl md:text-4xl text-white tracking-wide truncate">
                    {player?.nickname || 'Cargando jugador...'}
                  </h1>

                  {placement && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-['ITCMachine'] uppercase tracking-wider ${
                        placement.rank === 1
                          ? 'bg-[#fdc15a] text-black font-normal shadow-[0_0_12px_rgba(253,193,90,0.4)]'
                          : placement.rank === 2
                          ? 'bg-slate-300 text-black font-normal shadow-[0_0_10px_rgba(203,213,225,0.3)]'
                          : placement.rank === 3
                          ? 'bg-amber-600 text-white font-normal shadow-[0_0_10px_rgba(217,119,6,0.3)]'
                          : 'bg-white/10 text-zinc-300 border border-white/10 font-normal'
                      }`}
                    >
                      {placement.title}
                    </span>
                  )}
                </div>

                {/* Subtítulos: Equipo, Seed y Rango */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  {player?.team && (
                    <div className="flex items-center gap-1.5">
                      {player.team.logo_url && (
                        <img
                          src={player.team.logo_url}
                          alt={player.team.name}
                          className="w-4 h-4 object-contain rounded-full bg-white/5"
                        />
                      )}
                      <span className="font-bold text-zinc-200 uppercase tracking-wider">
                        {player.team.name}
                      </span>
                    </div>
                  )}

                  <span className="text-zinc-600">•</span>

                  <span className="font-mono text-zinc-300">
                    Seed: <strong className="text-[#fdc15a]">#{player?.seed || '??'}</strong>
                  </span>

                  <span className="text-zinc-600">•</span>

                  <span className="font-mono text-zinc-300">
                    Rank 4K: <strong className="text-white">#{player?.country_rank || '??'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Controles: Selector de Jugador y Botón Cerrar */}
            <div className="flex items-center gap-2.5 sm:self-start">
              {/* Selector de jugador para saltar a otro sin cerrar */}
              {allPlayers.length > 0 && onSelectPlayer && (
                <div className="relative">
                  <select
                    value={playerId}
                    onChange={(e) => onSelectPlayer(e.target.value)}
                    className="bg-black/60 border border-white/10 hover:border-[#fdc15a]/50 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#fdc15a] transition-colors cursor-pointer font-mono"
                    title="Ver scores de otro jugador"
                  >
                    {allPlayers.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                        {p.nickname} {p.team?.name ? `(${p.team.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botón Cerrar (X) */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-lg"
                title="Cerrar panel (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* FRANJA DE MÉTRICAS GLOBALES DEL JUGADOR */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/5">
              {/* Total Mapas */}
              <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">
                  MAPAS JUGADOS
                </span>
                <span className="font-['ITCMachine'] text-lg sm:text-xl text-white">
                  {metrics.totalMapsPlayed}
                </span>
                <span className="text-[10px] text-zinc-400 block font-mono">
                  {metrics.qualifierMapsPlayed} Qualis • {metrics.bracketMapsPlayed} Brackets
                </span>
              </div>

              {/* Winrate en Brackets */}
              <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">
                  WINRATE BRACKETS
                </span>
                <span
                  className={`font-['ITCMachine'] text-lg sm:text-xl ${
                    metrics.bracketWinrate >= 60
                      ? 'text-[#fdc15a]'
                      : metrics.bracketWinrate >= 40
                      ? 'text-cyan-400'
                      : 'text-zinc-300'
                  }`}
                >
                  {metrics.bracketWinrate}%
                </span>
                <span className="text-[10px] text-zinc-400 block font-mono">
                  {metrics.bracketMapsWon}W - {metrics.bracketMapsLost}L
                </span>
              </div>

              {/* Score Promedio */}
              <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">
                  SCORE PROMEDIO
                </span>
                <span className="font-['ITCMachine'] text-lg sm:text-xl text-white">
                  {metrics.overallAvgScore.toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-400 block font-mono">
                  Global del torneo
                </span>
              </div>

              {/* Precisión Promedio */}
              <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">
                  ACC PROMEDIO
                </span>
                <span className="font-['ITCMachine'] text-lg sm:text-xl text-[#fdc15a]">
                  {metrics.overallAvgAcc.toFixed(2)}%
                </span>
                <span className="text-[10px] text-zinc-400 block font-mono">
                  Accuracy global
                </span>
              </div>

              {/* Mejor Score (Peak) */}
              <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans truncate">
                  MEJOR SCORE (PEAK)
                </span>
                <span className="font-['ITCMachine'] text-lg sm:text-xl text-emerald-400">
                  {metrics.peakScore > 0 ? metrics.peakScore.toLocaleString() : '--'}
                </span>
                <span className="text-[10px] text-zinc-400 block font-mono truncate" title={metrics.peakScoreMap}>
                  {metrics.peakScoreMap}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BARRA DE PESTAÑAS */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-white/5 bg-[#171717] overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`font-['ITCMachine'] text-xs sm:text-sm px-4 py-1.5 rounded-lg transition-all tracking-wider ${
              activeTab === 'resumen'
                ? 'bg-[#fdc15a] text-black font-normal shadow-[0_0_12px_rgba(253,193,90,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            RESUMEN GENERAL
          </button>

          <button
            onClick={() => setActiveTab('qualifiers')}
            className={`font-['ITCMachine'] text-xs sm:text-sm px-4 py-1.5 rounded-lg transition-all tracking-wider flex items-center gap-2 ${
              activeTab === 'qualifiers'
                ? 'bg-[#fdc15a] text-black font-normal shadow-[0_0_12px_rgba(253,193,90,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>QUALIFIERS</span>
            <span
              className={`text-xs font-sans font-bold tracking-normal px-2 py-0.5 rounded-full ${
                activeTab === 'qualifiers' ? 'bg-black/25 text-black' : 'bg-white/10 text-zinc-300'
              }`}
            >
              8
            </span>
          </button>

          <button
            onClick={() => setActiveTab('brackets')}
            className={`font-['ITCMachine'] text-xs sm:text-sm px-4 py-1.5 rounded-lg transition-all tracking-wider flex items-center gap-2 ${
              activeTab === 'brackets'
                ? 'bg-[#fdc15a] text-black font-normal shadow-[0_0_12px_rgba(253,193,90,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>BRACKETS</span>
            <span
              className={`text-xs font-sans font-bold tracking-normal px-2 py-0.5 rounded-full ${
                activeTab === 'brackets' ? 'bg-black/25 text-black' : 'bg-white/10 text-zinc-300'
              }`}
            >
              {stats?.allBracketMapScores.length || 0}
            </span>
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-[#fdc15a] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="font-['ITCMachine'] text-base tracking-widest text-zinc-400">
                CARGANDO HISTORIAL DE SCORES...
              </p>
            </div>
          ) : stats ? (
            <>
              {/* ============================================================== */}
              {/* TAB 1: RESUMEN GENERAL                                         */}
              {/* ============================================================== */}
              {activeTab === 'resumen' && (
                <div className="space-y-6">
                  {/* Resumen de Qualifiers y Brackets en paralelo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Caja de Qualifiers */}
                    <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 shadow-md">
                      <div className="pb-3 mb-3 border-b border-white/5">
                        <h3 className="font-['ITCMachine'] text-lg text-white tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#fdc15a]"></span>
                          FASE CLASIFICATORIA (QUALIFIERS)
                        </h3>
                      </div>

                      {stats.qualifiersSummary ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 font-bold block uppercase">SEED</span>
                            <span className="font-['ITCMachine'] text-xl text-[#fdc15a]">
                              #{stats.qualifiersSummary.seed}
                            </span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 font-bold block uppercase">AVR RANK</span>
                            <span className="font-['ITCMachine'] text-xl text-white">
                              {stats.qualifiersSummary.avgRank}
                            </span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 font-bold block uppercase">AVG SCORE</span>
                            <span className="font-['ITCMachine'] text-lg text-white">
                              {stats.qualifiersSummary.avgScore.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-zinc-500 font-bold block uppercase">TOTAL</span>
                            <span className="font-['ITCMachine'] text-lg text-zinc-300">
                              {stats.qualifiersSummary.totalScore.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">Sin datos de clasificatorias.</p>
                      )}
                    </div>

                    {/* Caja de Brackets */}
                    <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 shadow-md">
                      <div className="pb-3 mb-3 border-b border-white/5">
                        <h3 className="font-['ITCMachine'] text-lg text-white tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          FASE DE ELIMINATORIAS (BRACKETS)
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase">RONDAS</span>
                          <span className="font-['ITCMachine'] text-xl text-white">
                            {stats.bracketMatches.length}
                          </span>
                        </div>
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase">MAPAS INDIV.</span>
                          <span className="font-['ITCMachine'] text-xl text-cyan-400">
                            {stats.allBracketMapScores.length}
                          </span>
                        </div>
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase">VICTORIAS</span>
                          <span className="font-['ITCMachine'] text-xl text-emerald-400">
                            {stats.metrics.bracketMapsWon}
                          </span>
                        </div>
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase">DERROTAS</span>
                          <span className="font-['ITCMachine'] text-xl text-rose-400">
                            {stats.metrics.bracketMapsLost}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Mejores Scores del Torneo */}
                  <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 shadow-md">
                    <h3 className="font-['ITCMachine'] text-lg text-white tracking-wider mb-4 flex items-center gap-2">
                      <span className="text-[#fdc15a]">★</span>
                      TOP 5 MEJORES SCORES DEL TORNEO
                    </h3>

                    {(() => {
                      const allScores = [
                        ...stats.qualifierScores
                          .filter((q) => q.best_score > 0)
                          .map((q) => ({
                            stage: 'QUALIFIERS',
                            beatmapId: q.beatmap_id,
                            mapName: `${q.pattern_type} ${q.slot} - ${q.title}`,
                            pattern: q.pattern_type,
                            score: q.best_score,
                            acc: q.best_accuracy,
                            rival: 'Clasificatorias',
                            result: `#${q.rank_in_map} en el mapa`,
                            isWin: true,
                          })),
                        ...stats.allBracketMapScores.map((b) => ({
                          stage: b.stage,
                          beatmapId: b.beatmap_id,
                          mapName: `${b.map_pattern} ${b.map_slot} - ${b.map_title}`,
                          pattern: b.map_pattern,
                          score: b.player_score,
                          acc: b.player_acc,
                          rival: `vs ${b.rival_nickname}`,
                          result: b.won ? 'VICTORIA' : 'DERROTA',
                          isWin: b.won,
                        })),
                      ].sort((a, b) => b.score - a.score).slice(0, 5);

                      if (allScores.length === 0) {
                        return <p className="text-xs text-zinc-500">No hay scores registrados.</p>;
                      }

                      return (
                        <div className="space-y-2">
                          {allScores.map((item, idx) => {
                            const pColor = getPatternColor(item.pattern);
                            return (
                              <div
                                key={idx}
                                className="bg-black/40 border border-white/5 hover:border-white/15 p-3 rounded-xl flex items-center justify-between gap-3 sm:gap-4 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                                      idx === 0
                                        ? 'bg-[#fdc15a] text-black shadow-[0_0_8px_rgba(253,193,90,0.4)]'
                                        : idx === 1
                                        ? 'bg-slate-300 text-black'
                                        : idx === 2
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-white/10 text-zinc-400'
                                    }`}
                                  >
                                    #{idx + 1}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    {item.beatmapId ? (
                                      <a
                                        href={`https://osu.ppy.sh/b/${item.beatmapId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm font-bold text-white hover:text-[#fdc15a] transition-colors truncate block group"
                                        title="Ver mapa en osu! (abre pestaña nueva)"
                                      >
                                        {item.mapName}
                                        <span className="text-[10px] text-zinc-500 group-hover:text-[#fdc15a] ml-1 font-normal">↗</span>
                                      </a>
                                    ) : (
                                      <span className="text-xs sm:text-sm font-bold text-white block truncate">
                                        {item.mapName}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                                      <span className="uppercase font-mono text-[#fdc15a]">{item.stage}</span>
                                      <span>•</span>
                                      <span className="truncate">{item.rival}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                  <div className="w-24 sm:w-28 text-right shrink-0">
                                    <span className="font-mono text-sm sm:text-base font-bold text-white block">
                                      {item.score.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-mono text-[#fdc15a]">
                                      {item.acc.toFixed(2)}%
                                    </span>
                                  </div>

                                  <div className="w-28 sm:w-32 flex justify-end shrink-0">
                                    <span
                                      className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded text-center inline-block w-full truncate ${
                                        item.isWin
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                      }`}
                                    >
                                      {item.result}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: QUALIFIERS (STAGES 1 - 8)                               */}
              {/* ============================================================== */}
              {activeTab === 'qualifiers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-white/5">
                    <span>Desempeño en los 8 mapas clasificatorios</span>
                    {stats.qualifiersSummary && (
                      <span className="font-mono">
                        Seed obtenido:{' '}
                        <strong className="text-[#fdc15a]">#{stats.qualifiersSummary.seed}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stats.qualifierScores.map((q) => {
                      const pColor = getPatternColor(q.pattern_type);
                      const hasPlayed = q.best_score > 0;

                      return (
                        <div
                          key={q.map_id}
                          className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-3 shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-black uppercase tracking-wider ${pColor.bg} ${pColor.text} ${pColor.border} border`}
                                >
                                  STAGE {q.slot} • {q.pattern_type}
                                </span>
                                {q.rank_in_map > 0 && (
                                  <span className="text-[11px] sm:text-xs font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                                    Puesto #{q.rank_in_map} / {q.total_players}
                                  </span>
                                )}
                              </div>
                              {q.beatmap_id ? (
                                <a
                                  href={`https://osu.ppy.sh/b/${q.beatmap_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs sm:text-sm font-bold text-white hover:text-[#fdc15a] transition-colors truncate block group"
                                  title="Ver mapa en osu! (abre pestaña nueva)"
                                >
                                  {q.title}
                                  <span className="text-[10px] text-zinc-500 group-hover:text-[#fdc15a] ml-1 font-normal">↗</span>
                                </a>
                              ) : (
                                <h4 className="text-xs sm:text-sm font-bold text-white truncate" title={q.title}>
                                  {q.title}
                                </h4>
                              )}
                              <p className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5" title={q.artist}>
                                {q.artist} • {q.difficulty_name}
                              </p>
                            </div>

                            {/* Puesto / Medalla de mapa */}
                            {q.rank_in_map === 1 ? (
                              <span className="bg-[#fdc15a] text-black text-[11px] px-2.5 py-0.5 rounded font-black shrink-0 shadow-[0_0_10px_rgba(253,193,90,0.5)]">
                                #1 RECORD
                              </span>
                            ) : q.rank_in_map > 0 && q.rank_in_map <= 3 ? (
                              <span className="bg-slate-300 text-black text-[11px] px-2.5 py-0.5 rounded font-black shrink-0">
                                TOP {q.rank_in_map}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                            <div className="flex items-center gap-5">
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                                  MEJOR SCORE
                                </span>
                                <span className="font-mono text-sm sm:text-base font-bold text-white">
                                  {hasPlayed ? q.best_score.toLocaleString() : 'No jugado'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                                  PRECISIÓN
                                </span>
                                <span className="font-mono text-sm sm:text-base font-bold text-[#fdc15a]">
                                  {hasPlayed ? `${q.best_accuracy.toFixed(2)}%` : '--'}
                                </span>
                              </div>
                            </div>

                            {q.attempts_count > 1 && (
                              <span className="text-xs text-zinc-400 font-mono">
                                {q.attempts_count} intentos
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: BRACKETS (PARTIDAS Y CRUCES DETALLADOS)                 */}
              {/* ============================================================== */}
              {activeTab === 'brackets' && (
                <div className="space-y-6">
                  {stats.bracketMatches.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      Este jugador no disputó partidas en el cuadro de Brackets.
                    </div>
                  ) : (
                    stats.bracketMatches.map((group) => (
                      <div
                        key={group.match_id}
                        className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden shadow-lg"
                      >
                        {/* CABECERA DEL MATCH */}
                        <div className="p-4 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded text-xs sm:text-sm font-['ITCMachine'] text-[#fdc15a] bg-[#fdc15a]/10 border border-[#fdc15a]/30 uppercase tracking-widest">
                              {group.stage}
                            </span>

                            <div className="flex items-center gap-2">
                              {group.opponent_team_logo && (
                                <img
                                  src={group.opponent_team_logo}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-contain bg-white/5"
                                />
                              )}
                              <span className="text-xs sm:text-sm font-bold text-white">
                                vs {group.opponent_team_name}
                              </span>
                            </div>

                            <span
                              className={`text-xs sm:text-sm font-['ITCMachine'] tracking-wider px-2.5 py-1 rounded ${
                                group.series_won
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {group.series_won ? 'VICTORIA' : 'DERROTA'} ({group.team_score} -{' '}
                              {group.opponent_team_score})
                            </span>
                          </div>

                          {/* MP Link de la sala */}
                          {group.mp_link && (
                            <a
                              href={group.mp_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono text-[#fdc15a] hover:underline flex items-center gap-1 shrink-0"
                              title="Ver historial de la sala multijugador en osu!"
                            >
                              <span>VER EN OSU!</span>
                              <span>↗</span>
                            </a>
                          )}
                        </div>

                        {/* LISTA DE MAPAS DISPUTADOS EN ESTA SERIE */}
                        <div className="p-4 space-y-3">
                          {group.maps.map((mapScore) => {
                            const pColor = getPatternColor(mapScore.map_pattern);

                            return (
                              <div
                                key={mapScore.id}
                                className="bg-[#141414] p-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors space-y-2.5"
                              >
                                {/* Fila superior: Slot, Nombre del mapa y Resultado */}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-black uppercase tracking-wider ${pColor.bg} ${pColor.text} ${pColor.border} border shrink-0`}
                                    >
                                      {mapScore.map_pattern} {mapScore.map_slot}
                                    </span>
                                    {mapScore.beatmap_id ? (
                                      <a
                                        href={`https://osu.ppy.sh/b/${mapScore.beatmap_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm font-bold text-white hover:text-[#fdc15a] transition-colors truncate block group"
                                        title="Ver mapa en osu! (abre pestaña nueva)"
                                      >
                                        {mapScore.map_artist} - {mapScore.map_title}
                                        <span className="text-[10px] text-zinc-500 group-hover:text-[#fdc15a] ml-1 font-normal">↗</span>
                                      </a>
                                    ) : (
                                      <span className="text-xs sm:text-sm font-bold text-white truncate" title={mapScore.map_title}>
                                        {mapScore.map_artist} - {mapScore.map_title}
                                      </span>
                                    )}
                                  </div>

                                  <span
                                    className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded shrink-0 ${
                                      mapScore.won
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    }`}
                                  >
                                    {mapScore.won ? 'VICTORIA' : 'DERROTA'}{' '}
                                    {mapScore.score_diff > 0
                                      ? `(+${mapScore.score_diff.toLocaleString()})`
                                      : `(${mapScore.score_diff.toLocaleString()})`}
                                  </span>
                                </div>

                                {/* Comparativa Cara a Cara: Jugador vs Rival */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                                  {/* Columna Jugador */}
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-[10px] font-bold text-[#fdc15a] uppercase block tracking-wider truncate">
                                        {player?.nickname}
                                      </span>
                                      <div className="flex items-baseline gap-2">
                                        <span className="font-mono text-base font-bold text-white">
                                          {mapScore.player_score.toLocaleString()}
                                        </span>
                                        <span className="font-mono text-xs text-[#fdc15a]">
                                          {mapScore.player_acc.toFixed(2)}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Juicios del Jugador separados por / */}
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs font-mono">
                                      <span title="Marvelous (320)" className="text-cyan-400 font-bold">
                                        {mapScore.marvelous}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Perfect (300)" className="text-[#fdc15a] font-bold">
                                        {mapScore.perfect}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Great (200)" className="text-emerald-400 font-bold">
                                        {mapScore.great}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Good (100)" className="text-blue-400 font-bold">
                                        {mapScore.good}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Bad (50)" className="text-amber-500 font-bold">
                                        {mapScore.bad}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Miss (0)" className="text-rose-500 font-bold">
                                        {mapScore.miss}
                                      </span>
                                    </div>

                                    {/* Combo y Ratio del Jugador */}
                                    <div className="flex items-center gap-2.5 text-[11px] sm:text-xs font-mono text-zinc-400">
                                      <span>
                                        Combo: <strong className="text-white">{mapScore.combo}x</strong>
                                      </span>
                                      <span className="text-zinc-600">•</span>
                                      <span>
                                        Ratio: <strong className="text-[#fdc15a]">{mapScore.ratio}:1</strong>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Columna Rival */}
                                  <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-white/5 pt-2.5 sm:pt-0 sm:pl-3">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        {mapScore.rival_avatar_url && (
                                          <img
                                            src={mapScore.rival_avatar_url}
                                            alt=""
                                            className="w-3.5 h-3.5 rounded-full object-cover"
                                          />
                                        )}
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider truncate">
                                          {mapScore.rival_nickname}
                                        </span>
                                      </div>
                                      <div className="flex items-baseline gap-2">
                                        <span className="font-mono text-base font-bold text-zinc-300">
                                          {mapScore.rival_score.toLocaleString()}
                                        </span>
                                        <span className="font-mono text-xs text-zinc-400">
                                          {mapScore.rival_acc.toFixed(2)}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Juicios del Rival separados por / */}
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs font-mono">
                                      <span title="Marvelous (320)" className="text-cyan-400 font-bold">
                                        {mapScore.rival_marvelous}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Perfect (300)" className="text-[#fdc15a] font-bold">
                                        {mapScore.rival_perfect}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Great (200)" className="text-emerald-400 font-bold">
                                        {mapScore.rival_great}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Good (100)" className="text-blue-400 font-bold">
                                        {mapScore.rival_good}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Bad (50)" className="text-amber-500 font-bold">
                                        {mapScore.rival_bad}
                                      </span>
                                      <span className="text-zinc-600 font-normal">/</span>
                                      <span title="Miss (0)" className="text-rose-500 font-bold">
                                        {mapScore.rival_miss}
                                      </span>
                                    </div>

                                    {/* Combo y Ratio del Rival */}
                                    <div className="flex items-center gap-2.5 text-[11px] sm:text-xs font-mono text-zinc-400">
                                      <span>
                                        Combo: <strong className="text-zinc-200">{mapScore.rival_combo}x</strong>
                                      </span>
                                      <span className="text-zinc-600">•</span>
                                      <span>
                                        Ratio: <strong className="text-zinc-300">{mapScore.rival_ratio}:1</strong>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-zinc-500 text-xs">
              No se encontraron datos para este jugador.
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-3 bg-[#171717] border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 px-6">
          <span>CNARG 4K 2026 • Historial Oficial de Scores</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
