'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import PlayerCard from '../../components/PlayerCard';
import PlayerScoresModal from '../../components/PlayerScoresModal';
import LoadingScreen from '../../components/LoadingScreen';
import {
  calculateTournamentPlacements,
  TournamentPlacement,
} from '../../lib/tournamentPlacements';

interface CachedPlayersData {
  jugadores: any[];
  matches: any[];
}

let playersCache: CachedPlayersData | null = null;

async function fetchWithRetry<T = any>(
  fn: () => PromiseLike<{ data: T | null; error: any }> | Promise<{ data: T | null; error: any }>,
  retries = 2,
  delayMs = 1200
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fn();
      if (!res.error && res.data) return res;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return res;
      }
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return { data: null, error: err };
      }
    }
  }
  return { data: null, error: new Error('Exceeded retries') };
}

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerIdForStats, setSelectedPlayerIdForStats] = useState<string | null>(null);

  // Vistas y filtros
  const [viewMode, setViewMode] = useState<'teams' | 'individual'>('teams');
  const [sortBy, setSortBy] = useState<'placement' | 'seed' | 'rank' | 'name'>('placement');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (playersCache) {
      setJugadores(playersCache.jugadores);
      setMatches(playersCache.matches);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [playersRes, matchesRes] = await Promise.all([
        fetchWithRetry(() => supabase.from('players').select(`*, teams (id, name, logo_url)`)),
        fetchWithRetry(() =>
          supabase
            .from('matches')
            .select(
              'id, stage, bracket_group, team_1_id, team_2_id, team_1_score, team_2_score, match_order'
            )
        ),
      ]);

      const playersData = playersRes.data || [];
      const matchesData = matchesRes.data || [];
      playersCache = {
        jugadores: playersData,
        matches: matchesData,
      };
      setJugadores(playersData);
      setMatches(matchesData);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Jugadores | CNARG 4K 2026';
    fetchData();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pParam = params.get('player') || params.get('p');
      if (pParam) {
        supabase
          .from('players')
          .select('id, nickname')
          .or(`nickname.ilike.%${pParam}%,id.eq.${pParam}`)
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setSelectedPlayerIdForStats(data[0].id);
            }
          });
      }
    }
  }, []);

  // Calcular las posiciones finales (Brackets) de cada equipo
  const teamPlacements = useMemo(() => {
    return calculateTournamentPlacements(matches);
  }, [matches]);

  // Agrupación por equipos con posiciones de brackets
  const teamsGrouped = useMemo(() => {
    const map: Record<
      string,
      { team: any; players: any[]; placement?: TournamentPlacement }
    > = {};

    for (const p of jugadores) {
      if (!p.team_id) continue;
      if (!map[p.team_id]) {
        map[p.team_id] = {
          team: p.teams,
          players: [],
          placement: teamPlacements[p.team_id],
        };
      }
      map[p.team_id].players.push(p);
    }

    // Ordenar jugadores dentro del equipo para que el seed menor esté primero y sea capitán
    for (const group of Object.values(map)) {
      group.players.sort((a, b) => (a.seed || 999) - (b.seed || 999));
    }

    // Ordenar los equipos: primero por posición en torneo (1º, 2º, etc.), luego por mejor seed
    return Object.values(map).sort((a, b) => {
      const rankA = a.placement?.rank || 999;
      const rankB = b.placement?.rank || 999;
      if (rankA !== rankB) return rankA - rankB;
      const seedA = Math.min(...a.players.map((p) => p.seed || 999));
      const seedB = Math.min(...b.players.map((p) => p.seed || 999));
      return seedA - seedB;
    });
  }, [jugadores, teamPlacements]);

  // Equipos filtrados por búsqueda
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teamsGrouped;
    const q = searchQuery.toLowerCase().trim();
    return teamsGrouped.filter((group) => {
      const teamMatch = group.team?.name?.toLowerCase().includes(q);
      const playerMatch = group.players.some((p) => p.nickname?.toLowerCase().includes(q));
      return teamMatch || playerMatch;
    });
  }, [teamsGrouped, searchQuery]);

  // Lista individual de jugadores ordenada y filtrada
  const filteredJugadores = useMemo(() => {
    let list = [...jugadores];

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nickname?.toLowerCase().includes(q) ||
          p.teams?.name?.toLowerCase().includes(q)
      );
    }

    // Ordenamiento individual
    return list.sort((a, b) => {
      const placementA = a.team_id ? teamPlacements[a.team_id] : undefined;
      const placementB = b.team_id ? teamPlacements[b.team_id] : undefined;
      const rankA = placementA?.rank || 999;
      const rankB = placementB?.rank || 999;

      if (sortBy === 'placement') {
        if (rankA !== rankB) return rankA - rankB;
        return (a.seed || 999) - (b.seed || 999);
      }
      if (sortBy === 'seed') {
        return (a.seed || 999) - (b.seed || 999);
      }
      if (sortBy === 'rank') {
        return (a.country_rank || 999999) - (b.country_rank || 999999);
      }
      if (sortBy === 'name') {
        return (a.nickname || '').localeCompare(b.nickname || '');
      }
      return 0;
    });
  }, [jugadores, teamPlacements, searchQuery, sortBy]);

  // Jugadores sin equipo (Fase Previa)
  const unassignedPlayers = useMemo(() => {
    return jugadores.filter((p) => !p.team_id);
  }, [jugadores]);

  // Logos de los 3 mejores equipos
  const topTeamLogos = useMemo(() => {
    const logos = {
      campeon: 'https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/FurryJacks.png',
      subcampeon: 'https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/JTEAM.png',
      tercerPuesto: 'https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/TheWind.png',
    };

    for (const group of teamsGrouped) {
      const name = (group.team?.name || '').toLowerCase().trim();
      const rank = group.placement?.rank;
      const logo = group.team?.logo_url;
      if (!logo) continue;

      if (rank === 1 || name === 'furryjack') {
        logos.campeon = logo;
      } else if (rank === 2 || name === 'j team') {
        logos.subcampeon = logo;
      } else if (rank === 3 || name === 'the wind') {
        logos.tercerPuesto = logo;
      }
    }
    return logos;
  }, [teamsGrouped]);

  if (loading) {
    return <LoadingScreen message="CARGANDO JUGADORES..." />;
  }

  return (
    <div className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-32 select-none animate-fadeIn">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* TÍTULO PRINCIPAL */}
        <div className="text-center pt-8 sm:pt-14 mb-6 sm:mb-8">
          <h1 className="font-['ITCMachine'] text-4xl sm:text-6xl md:text-[90px] uppercase tracking-tighter leading-none drop-shadow-lg">
            JUGADORES
          </h1>
          <p className="text-zinc-400 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">
            Rosters oficiales, posiciones finales en brackets y estadísticas
          </p>
        </div>

        {/* BARRA DE RESUMEN DEL TORNEO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {/* Campeón */}
          <div className="bg-[#1a1a1a] p-3.5 sm:p-4 rounded-xl border-2 border-[#fdc15a] shadow-[0_0_20px_rgba(253,193,90,0.2)] flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#fdc15a] font-black uppercase tracking-widest font-sans block mb-1">
                CAMPEONES
              </span>
              <span className="font-['ITCMachine'] text-xl sm:text-2xl md:text-[26px] text-white block truncate leading-none">
                FurryJack
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate block mt-1.5 font-medium">
                -hakitsu & SrIvanARGXD
              </span>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px] rounded-xl bg-black/60 border border-[#fdc15a]/40 p-1.5 flex-shrink-0 flex items-center justify-center shadow-lg">
              <img
                src={topTeamLogos.campeon}
                alt="FurryJack"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/no-logo.png';
                }}
              />
            </div>
          </div>

          {/* Subcampeón */}
          <div className="bg-[#1a1a1a] p-3.5 sm:p-4 rounded-xl border border-slate-300/40 shadow-lg flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest font-sans block mb-1">
                SUBCAMPEONES
              </span>
              <span className="font-['ITCMachine'] text-xl sm:text-2xl md:text-[26px] text-white block truncate leading-none">
                J TEAM
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate block mt-1.5 font-medium">
                Psyche03 & nefzsto
              </span>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px] rounded-xl bg-black/60 border border-slate-300/30 p-1.5 flex-shrink-0 flex items-center justify-center shadow-lg">
              <img
                src={topTeamLogos.subcampeon}
                alt="J TEAM"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/no-logo.png';
                }}
              />
            </div>
          </div>

          {/* 3º Puesto */}
          <div className="bg-[#1a1a1a] p-3.5 sm:p-4 rounded-xl border border-amber-600/40 shadow-lg flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest font-sans block mb-1">
                3º PUESTO
              </span>
              <span className="font-['ITCMachine'] text-xl sm:text-2xl md:text-[26px] text-white block truncate leading-none">
                The Wind
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate block mt-1.5 font-medium">
                Yuna- & ERA Mahiru
              </span>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px] rounded-xl bg-black/60 border border-amber-500/30 p-1.5 flex-shrink-0 flex items-center justify-center shadow-lg">
              <img
                src={topTeamLogos.tercerPuesto}
                alt="The Wind"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/no-logo.png';
                }}
              />
            </div>
          </div>

          {/* Estadísticas Generales */}
          <div className="bg-[#1a1a1a] p-3.5 sm:p-4 rounded-xl border border-white/5 shadow-lg flex flex-col justify-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-sans mb-1">
              PARTICIPANTES
            </span>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <div>
                <span className="font-['ITCMachine'] text-2xl sm:text-3xl md:text-4xl text-white leading-none">16</span>
                <span className="text-[11px] sm:text-xs text-zinc-400 ml-1.5">Equipos</span>
              </div>
              <div className="text-right">
                <span className="font-['ITCMachine'] text-2xl sm:text-3xl md:text-4xl text-[#fdc15a] leading-none">32</span>
                <span className="text-[11px] sm:text-xs text-zinc-400 ml-1.5">Jugadores</span>
              </div>
            </div>
          </div>
        </div>

        {/* SELECTOR DE VISTAS Y BUSCADOR */}
        <div className="bg-[#1a1a1a] p-3 sm:p-4 rounded-xl border border-white/5 shadow-xl mb-8 sm:mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector de Modo: Por Equipos vs Individual */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setViewMode('teams')}
              className={`font-['ITCMachine'] text-xs sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 tracking-wider ${
                viewMode === 'teams'
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_15px_rgba(253,193,90,0.3)] font-normal'
                  : 'bg-black/50 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              VISTA POR EQUIPOS (PAREJAS)
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`font-['ITCMachine'] text-xs sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 tracking-wider ${
                viewMode === 'individual'
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_15px_rgba(253,193,90,0.3)] font-normal'
                  : 'bg-black/50 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              VISTA INDIVIDUAL (ROSTER)
            </button>
          </div>

          {/* Ordenamiento (solo en Individual) y Buscador */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {viewMode === 'individual' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded px-3 py-2 text-xs font-['ITCMachine'] text-[#fdc15a] outline-none focus:border-[#fdc15a] transition-colors"
              >
                <option value="placement">ORDENAR: POSICIÓN TORNEO</option>
                <option value="seed">ORDENAR: SEED INDIVIDUAL</option>
                <option value="rank">ORDENAR: RANK NACIONAL 4K</option>
                <option value="name">ORDENAR: ALFABÉTICO</option>
              </select>
            )}

            {/* Buscador */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar jugador o equipo..."
                className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#fdc15a] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* VISTA 1: POR EQUIPOS */}
        {viewMode === 'teams' ? (
          <div className="space-y-8">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-dashed border-white/5">
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">
                  {searchQuery
                    ? `No se encontraron equipos para "${searchQuery}"`
                    : 'No hay equipos disponibles en esta categoría'}
                </p>
              </div>
            ) : (
              filteredTeams.map((group, idx) => {
                const placement = group.placement;
                const isChampion = placement?.rank === 1;
                const isRunnerUp = placement?.rank === 2;
                const isThird = placement?.rank === 3;

                // Estilo del contenedor del equipo según posición
                let teamContainerStyle = 'bg-[#141414] border border-white/5';
                let headerBadgeStyle = 'bg-white/5 text-zinc-400 border border-white/10';

                if (isChampion) {
                  teamContainerStyle =
                    'bg-gradient-to-b from-[#fdc15a]/10 via-[#141414] to-[#141414] border-2 border-[#fdc15a] shadow-[0_0_35px_rgba(253,193,90,0.25)]';
                  headerBadgeStyle =
                    'bg-[#fdc15a] text-black font-normal tracking-wider shadow-[0_0_15px_rgba(253,193,90,0.4)]';
                } else if (isRunnerUp) {
                  teamContainerStyle =
                    'bg-gradient-to-b from-slate-300/10 via-[#141414] to-[#141414] border-2 border-slate-300/60 shadow-[0_0_25px_rgba(203,213,225,0.2)]';
                  headerBadgeStyle =
                    'bg-slate-300 text-black font-normal tracking-wider shadow-[0_0_12px_rgba(203,213,225,0.3)]';
                } else if (isThird) {
                  teamContainerStyle =
                    'bg-gradient-to-b from-amber-600/10 via-[#141414] to-[#141414] border-2 border-amber-600/60 shadow-[0_0_25px_rgba(217,119,6,0.2)]';
                  headerBadgeStyle =
                    'bg-amber-600 text-white font-normal shadow-[0_0_12px_rgba(217,119,6,0.3)]';
                }

                return (
                  <div
                    key={group.team?.id || idx}
                    className={`rounded-3xl p-6 transition-all duration-300 ${teamContainerStyle}`}
                  >
                    {/* CABECERA DEL EQUIPO */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-white/5 gap-3">
                      <div className="flex items-center gap-4">
                        {/* Logo del Equipo */}
                        <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center shadow-md">
                          {group.team?.logo_url ? (
                            <img
                              src={group.team.logo_url}
                              alt={group.team.name}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <span className="font-['ITCMachine'] text-lg text-[#fdc15a]">
                              {group.team?.name?.charAt(0) || 'T'}
                            </span>
                          )}
                        </div>

                        {/* Nombre del Equipo */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-['ITCMachine'] text-2xl sm:text-3xl text-white tracking-wide">
                              {group.team?.name || 'Equipo'}
                            </h2>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400 block">
                            Seeds de equipo: #{group.players[0]?.seed || '??'} & #{group.players[1]?.seed || '??'}
                          </span>
                        </div>
                      </div>

                      {/* Badge de Posición Final en Brackets */}
                      {placement && (
                        <div
                          className={`px-4 py-1.5 rounded-full text-sm font-['ITCMachine'] uppercase tracking-wider flex items-center gap-2 w-fit sm:w-auto shadow-md ${headerBadgeStyle}`}
                        >
                          <span>{placement.title}</span>
                        </div>
                      )}
                    </div>

                    {/* TARJETAS DE LOS DOS JUGADORES (PAREJA) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {group.players.map((jugador, pIdx) => (
                        <PlayerCard
                          key={jugador.id}
                          nombre={jugador.nickname || `ID: ${jugador.osu_id}`}
                          osu_id={jugador.osu_id}
                          rank={jugador.country_rank || 'TBD'}
                          seed={jugador.seed || '??'}
                          avatar={jugador.avatar_url}
                          teamLogo={group.team?.logo_url}
                          teamName={group.team?.name}
                          placement={placement}
                          isCaptain={pIdx === 0}
                          showPlacementBadge={false}
                          onOpenStats={() => setSelectedPlayerIdForStats(jugador.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* VISTA 2: INDIVIDUAL (ROSTER DE JUGADORES EN GRILLA) */
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJugadores.map((jugador, index) => {
                const placement = jugador.team_id ? teamPlacements[jugador.team_id] : undefined;
                return (
                  <PlayerCard
                    key={jugador.id}
                    nombre={jugador.nickname || `ID: ${jugador.osu_id}`}
                    osu_id={jugador.osu_id}
                    rank={jugador.country_rank || 'TBD'}
                    seed={jugador.seed || '??'}
                    avatar={jugador.avatar_url}
                    teamLogo={jugador.teams?.logo_url}
                    teamName={jugador.teams?.name}
                    placement={placement}
                    onOpenStats={() => setSelectedPlayerIdForStats(jugador.id)}
                  />
                );
              })}
            </div>

            {filteredJugadores.length === 0 && (
              <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-dashed border-white/5">
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">
                  {searchQuery
                    ? `No se encontraron jugadores para "${searchQuery}"`
                    : 'No hay jugadores disponibles'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN ADICIONAL: JUGADORES NO CLASIFICADOS */}
        {unassignedPlayers.length > 0 && !searchQuery && (
          <div className="mt-16 pt-10 border-t border-white/5">
            <div className="mb-6">
              <h3 className="font-['ITCMachine'] text-2xl text-zinc-400">
                JUGADORES QUALIFIERS
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Participantes de la etapa de Qualifiers que no lograron clasificar al cuadro de brackets
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {unassignedPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerIdForStats(p.id)}
                  className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 hover:border-[#fdc15a]/40 transition-all flex items-center gap-3 group text-left cursor-pointer"
                  title={`Ver estadísticas de ${p.nickname}`}
                >
                  <img
                    src={p.avatar_url || (p.osu_id ? `https://a.ppy.sh/${p.osu_id}` : '/no-avatar.png')}
                    alt={p.nickname}
                    className="w-10 h-10 rounded-lg object-cover bg-black/50 border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/no-avatar.png';
                    }}
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-zinc-300 group-hover:text-[#fdc15a] truncate block transition-colors">
                      {p.nickname}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono block">
                      {p.country_rank ? `#${p.country_rank}` : 'TBD'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE HISTORIAL DE SCORES Y ESTADÍSTICAS */}
      <PlayerScoresModal
        playerId={selectedPlayerIdForStats}
        onClose={() => setSelectedPlayerIdForStats(null)}
        onSelectPlayer={(id) => setSelectedPlayerIdForStats(id)}
      />
    </div>
  );
}