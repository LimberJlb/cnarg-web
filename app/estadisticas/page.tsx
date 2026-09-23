'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import PlayerScoresModal from '../../components/PlayerScoresModal';
import {
  StatFilter,
  ProcessedScore,
  BeatmapData,
  Stage,
  MapSummaryStats,
} from '../../types/stats';
import {
  QualifierRawScore,
  QualifierPlayerResult,
} from '../../types/qualifiers';
import { calculateQualifierLeaderboard } from '../../lib/qualifiers';

const patternWeights: Record<string, number> = {
  RC: 1,
  HB: 2,
  LN: 3,
  SV: 4,
  TB: 5,
};

const stageOrder: Record<string, number> = {
  QUALIFIERS: 0,
  'ROUND OF 16': 1,
  QUARTERFINALS: 2,
  SEMIFINALS: 3,
  FINALS: 4,
  'GRAND FINALS': 5,
};

const getPatternColor = (type: string) => {
  switch (type) {
    case 'RC':
      return '#70ade3';
    case 'LN':
      return '#ff4d4d';
    case 'HB':
      return '#ff9933';
    case 'SV':
      return '#008000';
    case 'TB':
      return '#800080';
    default:
      return '#fdc15a';
  }
};

interface CachedStatsData {
  sortedStages: Stage[];
  mappool: BeatmapData[];
  qualifierScores: QualifierRawScore[];
  resultados: any[];
}

let statsCache: CachedStatsData | null = null;

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

function EstadisticasContent() {
  const searchParams = useSearchParams();
  const playerParam = searchParams.get('player') || searchParams.get('q') || '';

  const [rondaActual, setRondaActual] = useState('QUALIFIERS');
  const [mapaSeleccionado, setMapaSeleccionado] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<StatFilter>('score');
  const [searchQuery, setSearchQuery] = useState(playerParam);
  const [rondas, setRondas] = useState<Stage[]>([]);
  const [mappool, setMappool] = useState<BeatmapData[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [qualifierScores, setQualifierScores] = useState<QualifierRawScore[]>([]);
  const [qualifierView, setQualifierView] = useState<'leaderboard' | 'maps'>('leaderboard');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPlayerIdForStats, setSelectedPlayerIdForStats] = useState<string | null>(null);

  useEffect(() => {
    if (playerParam) {
      setSearchQuery(playerParam);
      setRondaActual('QUALIFIERS');
      setQualifierView('leaderboard');
    }
  }, [playerParam]);

  async function fetchAllStatsData(force = false) {
    if (!force && statsCache) {
      setRondas(statsCache.sortedStages);
      setMappool(statsCache.mappool);
      setQualifierScores(statsCache.qualifierScores);
      setResultados(statsCache.resultados);
      if (statsCache.sortedStages.length > 0) {
        const defaultStage =
          statsCache.sortedStages.find((s) => s.name.toUpperCase().includes('QUALIFIER')) ||
          statsCache.sortedStages[0];
        setRondaActual(defaultStage.name);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [stagesRes, mapsRes, matchRes, lobbiesRes, qualifierRes] = await Promise.all([
        fetchWithRetry(() => supabase.from('stages').select('*').eq('is_published', true)),
        fetchWithRetry(() => supabase.from('mappool_maps').select('*, stages(name)')),
        fetchWithRetry(() =>
          supabase.from('match_map_results').select(`
            *,
            player1:player_1_id(id, nickname, avatar_url, osu_id, team:team_id(name, logo_url)),
            player2:player_2_id(id, nickname, avatar_url, osu_id, team:team_id(name, logo_url))
          `)
        ),
        fetchWithRetry(() => supabase.from('lobbies').select('match_id, lobby_link, osu_match_id')),
        fetchWithRetry(() =>
          supabase.from('qualifier_scores').select(`
            *,
            player:player_id(id, nickname, avatar_url, osu_id, team:team_id(name, logo_url))
          `)
        ),
      ]);

      const sortedStages = ((stagesRes.data as Stage[]) || []).sort((a, b) => {
        const orderA = stageOrder[a.name.toUpperCase()] ?? 99;
        const orderB = stageOrder[b.name.toUpperCase()] ?? 99;
        return orderA - orderB;
      });

      const mappoolData = (mapsRes.data as BeatmapData[]) || [];
      const qualifierData = (qualifierRes.data as QualifierRawScore[]) || [];

      // Mapa de enlaces MP por match_id
      const lobbyMap: Record<string, string> = {};
      if (lobbiesRes.data) {
        lobbiesRes.data.forEach((l: any) => {
          lobbyMap[l.match_id] = l.lobby_link || l.osu_match_id;
        });
      }

      const parsedMatches = (matchRes.data || []).map((m: any) => ({
        ...m,
        mp_link: lobbyMap[m.match_id] || null,
      }));

      // Guardar en caché
      statsCache = {
        sortedStages,
        mappool: mappoolData,
        qualifierScores: qualifierData,
        resultados: parsedMatches,
      };

      setRondas(sortedStages);
      setMappool(mappoolData);
      setQualifierScores(qualifierData);
      setResultados(parsedMatches);

      // Establecer la primera ronda válida
      if (sortedStages.length > 0) {
        const defaultStage =
          sortedStages.find((s) => s.name.toUpperCase().includes('QUALIFIER')) ||
          sortedStages[0];
        setRondaActual(defaultStage.name);
      }
    } catch (err: any) {
      console.error('Error al cargar datos de estadísticas:', err);
      setLoadError('Hubo una demora al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Estadísticas | CNARG 4K 2026';
    fetchAllStatsData();
  }, []);

  const isQualifiers = rondaActual.toUpperCase().includes('QUALIFIER');

  // Mapas de la ronda actual ordenados por patrón y slot
  const mapasRonda = useMemo(() => {
    return mappool
      .filter((m) => m.stages?.name === rondaActual)
      .sort((a, b) => {
        const weightA = patternWeights[a.pattern_type] || 99;
        const weightB = patternWeights[b.pattern_type] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return a.slot - b.slot;
      });
  }, [mappool, rondaActual]);

  // Mapas de Qualifiers ordenados por slot
  const qualifierMaps = useMemo(() => {
    return mappool
      .filter((m) => m.stages?.name?.toUpperCase().includes('QUALIFIER'))
      .sort((a, b) => a.slot - b.slot);
  }, [mappool]);

  // Leaderboard general de Qualifiers calculado con la fórmula oficial de avr rank
  const qualifierLeaderboard = useMemo(() => {
    return calculateQualifierLeaderboard(qualifierScores, qualifierMaps);
  }, [qualifierScores, qualifierMaps]);

  const filteredQualifierLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return qualifierLeaderboard;
    const q = searchQuery.toLowerCase().trim();
    return qualifierLeaderboard.filter(
      (p) =>
        p.nickname.toLowerCase().includes(q) ||
        (p.team_name && p.team_name.toLowerCase().includes(q))
    );
  }, [qualifierLeaderboard, searchQuery]);

  // Autoseleccionar el primer mapa de la ronda al cambiar de ronda
  useEffect(() => {
    if (mapasRonda.length > 0) {
      setMapaSeleccionado(mapasRonda[0].id);
    } else {
      setMapaSeleccionado(null);
    }
  }, [mapasRonda]);

  // Jugadores y scores del mapa de Qualifiers seleccionado
  const qualifierMapPlayers = useMemo(() => {
    if (!isQualifiers || !mapaSeleccionado) return [];
    const list = qualifierLeaderboard
      .map((p) => {
        const mData = p.maps[mapaSeleccionado];
        if (!mData) return null;
        return {
          seed: p.seed,
          player_id: p.player_id,
          nickname: p.nickname,
          avatar_url: p.avatar_url,
          osu_id: p.osu_id,
          team_name: p.team_name,
          team_logo: p.team_logo,
          rankInMap: mData.rank,
          bestScore: mData.bestScore,
          bestAccuracy: mData.bestAccuracy,
          attempts: mData.attempts,
        };
      })
      .filter(Boolean) as {
        seed: number;
        player_id: string;
        nickname: string;
        avatar_url: string | null;
        osu_id: number;
        team_name?: string;
        team_logo?: string | null;
        rankInMap: number;
        bestScore: number;
        bestAccuracy: number;
        attempts: any[];
      }[];

    list.sort((a, b) => a.rankInMap - b.rankInMap);

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.nickname.toLowerCase().includes(q) ||
        (item.team_name && item.team_name.toLowerCase().includes(q))
    );
  }, [isQualifiers, mapaSeleccionado, qualifierLeaderboard, searchQuery]);

  // Resumen del mapa de Qualifiers seleccionado
  const qualifierMapSummary: MapSummaryStats = useMemo(() => {
    if (!isQualifiers || !mapaSeleccionado || qualifierMapPlayers.length === 0) {
      return { highScore: 0, avgScore: 0, avgAcc: 0, totalPlays: 0 };
    }
    const total = qualifierMapPlayers.length;
    const maxScore = Math.max(...qualifierMapPlayers.map((p) => p.bestScore));
    const totalScore = qualifierMapPlayers.reduce((acc, p) => acc + p.bestScore, 0);
    const totalAcc = qualifierMapPlayers.reduce((acc, p) => {
      const a = p.bestAccuracy <= 1 ? p.bestAccuracy * 100 : p.bestAccuracy;
      return acc + a;
    }, 0);
    const best = qualifierMapPlayers.find((p) => p.bestScore === maxScore);

    return {
      highScore: maxScore,
      avgScore: Math.round(totalScore / total),
      avgAcc: Number((totalAcc / total).toFixed(2)),
      totalPlays: total,
      bestPlayer: best?.nickname,
    };
  }, [isQualifiers, mapaSeleccionado, qualifierMapPlayers]);

  const mapaData = useMemo(() => {
    return mappool.find((m) => m.id === mapaSeleccionado) || null;
  }, [mappool, mapaSeleccionado]);

  // Procesamiento y ordenamiento de scores del mapa seleccionado
  const scoresDelMapa = useMemo(() => {
    if (!mapaSeleccionado) return [];

    const processPlayer = (
      player: any,
      score: number,
      acc: number,
      m: number,
      pft: number,
      g: number,
      go: number,
      b: number,
      mi: number,
      link: string | null
    ): ProcessedScore | null => {
      if (!player?.nickname) return null;

      const totalHits = (m || 0) + (pft || 0) + (g || 0) + (go || 0) + (b || 0) + (mi || 0);
      const marvRate = totalHits > 0 ? ((m || 0) / totalHits) * 100 : 0;
      const mapaRatio = (pft || 0) > 0 ? (m || 0) / pft : m || 0;
      const errorRate =
        totalHits > 0 ? (((g || 0) + (go || 0) + (b || 0) + (mi || 0)) / totalHits) * 100 : 0;

      return {
        id: player.id,
        player_id: player.id,
        nickname: player.nickname,
        osu_id: player.osu_id,
        avatar_url: player.avatar_url,
        team: player.team?.name,
        team_logo: player.team?.logo_url,
        mp_link: link,
        score: score || 0,
        accuracy: acc || 0,
        marvelous_rate: marvRate,
        mapa_ratio: mapaRatio,
        error_rate: errorRate,
        judgments: {
          m: m || 0,
          pft: pft || 0,
          g: g || 0,
          go: go || 0,
          b: b || 0,
          mi: mi || 0,
        },
      };
    };

    const data = resultados
      .filter((r) => r.map_id === mapaSeleccionado)
      .flatMap((r) => [
        processPlayer(
          r.player1,
          r.score_1,
          r.p1_accuracy,
          r.p1_marvelous,
          r.p1_perfects,
          r.p1_greats,
          r.p1_goods,
          r.p1_bads,
          r.p1_misses,
          r.mp_link
        ),
        processPlayer(
          r.player2,
          r.score_2,
          r.p2_accuracy,
          r.p2_marvelous,
          r.p2_perfects,
          r.p2_greats,
          r.p2_goods,
          r.p2_bads,
          r.p2_misses,
          r.mp_link
        ),
      ])
      .filter(Boolean) as ProcessedScore[];

    return data.sort((a, b) => {
      if (statFilter === 'error_rate') {
        return a[statFilter] - b[statFilter];
      }
      return b[statFilter] - a[statFilter];
    });
  }, [resultados, mapaSeleccionado, statFilter]);

  // Métricas globales del mapa
  const summaryStats: MapSummaryStats = useMemo(() => {
    if (!scoresDelMapa || scoresDelMapa.length === 0) {
      return { highScore: 0, avgScore: 0, avgAcc: 0, totalPlays: 0, totalMatches: 0 };
    }
    const total = scoresDelMapa.length;
    const maxScore = Math.max(...scoresDelMapa.map((s) => s.score));
    const totalScore = scoresDelMapa.reduce((acc, s) => acc + s.score, 0);
    const totalAcc = scoresDelMapa.reduce((acc, s) => {
      const a = s.accuracy <= 1 ? s.accuracy * 100 : s.accuracy;
      return acc + a;
    }, 0);

    const best = scoresDelMapa.find((s) => s.score === maxScore);
    const matchCount = resultados.filter((r) => r.map_id === mapaSeleccionado).length;

    return {
      highScore: maxScore,
      avgScore: Math.round(totalScore / total),
      avgAcc: Number((totalAcc / total).toFixed(2)),
      totalPlays: total,
      totalMatches: matchCount || Math.ceil(total / 2),
      bestPlayer: best?.nickname,
    };
  }, [scoresDelMapa, resultados, mapaSeleccionado]);

  // Filtrado de jugadores por búsqueda
  const filteredScores = useMemo(() => {
    if (!searchQuery.trim()) return scoresDelMapa;
    const q = searchQuery.toLowerCase().trim();
    return scoresDelMapa.filter(
      (s) =>
        s.nickname.toLowerCase().includes(q) ||
        (s.team && s.team.toLowerCase().includes(q))
    );
  }, [scoresDelMapa, searchQuery]);

  if (loading) {
    return <LoadingScreen message="CARGANDO ESTADÍSTICAS..." />;
  }

  if (loadError && !loading) {
    return (
      <main className="min-h-screen bg-[#2e2e2e] flex flex-col items-center justify-center gap-6 p-4 select-none">
        <div className="bg-[#1a1a1a] border border-amber-500/40 p-8 rounded-2xl max-w-md text-center shadow-[0_0_30px_rgba(253,193,90,0.15)]">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-[#fdc15a] mx-auto flex items-center justify-center mb-4 text-2xl font-bold font-mono">
            !
          </div>
          <h2 className="font-['ITCMachine'] text-2xl text-white mb-2 uppercase tracking-wide">
            DEMORA DE CONEXIÓN
          </h2>
          <p className="text-zinc-400 text-xs mb-6">
            La conexión con la base de datos demoró más de lo esperado.
          </p>
          <button
            onClick={() => fetchAllStatsData(true)}
            className="px-6 py-2.5 rounded-xl bg-[#fdc15a] hover:bg-[#ffe28a] text-black font-['ITCMachine'] font-normal text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(253,193,90,0.4)] active:scale-95"
          >
            REINTENTAR CARGA
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans pb-24 select-none animate-fadeIn">
      {/* Título Principal */}
      <div className="text-center pt-8 sm:pt-14 mb-6 sm:mb-8 px-4">
        <h1 className="font-['ITCMachine'] text-4xl sm:text-6xl md:text-[85px] lg:text-[90px] uppercase tracking-tighter leading-none">
          LEADERBOARDS
        </h1>
        <p className="text-zinc-400 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">
          Estadísticas detalladas de partidas por mapa y ronda
        </p>
      </div>

      {/* Selector de Rondas (Solo llaves, sin Qualifiers) */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 px-4 max-w-5xl mx-auto">
        {rondas.map((ronda) => {
          const isSelected = rondaActual === ronda.name;
          return (
            <button
              key={ronda.id}
              onClick={() => setRondaActual(ronda.name)}
              className={`font-['ITCMachine'] text-sm sm:text-lg px-4 sm:px-7 py-2 sm:py-2.5 rounded-lg transition-all tracking-wider ${
                isSelected
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_20px_rgba(253,193,90,0.3)] scale-105 font-normal'
                  : 'bg-black/40 text-zinc-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {ronda.name}
            </button>
          );
        })}
      </div>

      {/* Subselector para Qualifiers */}
      {isQualifiers && (
        <div className="flex justify-center items-center gap-3 mb-8 px-4">
          <button
            onClick={() => setQualifierView('leaderboard')}
            className={`font-['ITCMachine'] text-base md:text-lg px-6 py-2.5 rounded-lg transition-all tracking-wider flex items-center gap-2 ${
              qualifierView === 'leaderboard'
                ? 'bg-[#fdc15a] text-black shadow-[0_0_20px_rgba(253,193,90,0.3)] font-normal scale-105'
                : 'bg-black/40 text-zinc-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            TABLA GENERAL (AVR RANK / SEEDING)
          </button>
          <button
            onClick={() => setQualifierView('maps')}
            className={`font-['ITCMachine'] text-base md:text-lg px-6 py-2.5 rounded-lg transition-all tracking-wider flex items-center gap-2 ${
              qualifierView === 'maps'
                ? 'bg-[#fdc15a] text-black shadow-[0_0_20px_rgba(253,193,90,0.3)] font-normal scale-105'
                : 'bg-black/40 text-zinc-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            POR MAPA (STAGE 1 - 8)
          </button>
        </div>
      )}

      {/* CASO 1: VISTA GENERAL DE QUALIFIERS (AVR RANK / SEEDING) */}
      {isQualifiers && qualifierView === 'leaderboard' ? (
        <div className="max-w-[1340px] mx-auto px-4 space-y-6">
          {/* Encabezado descriptivo y buscador */}
          <div className="bg-[#1a1a1a] p-6 rounded border border-white/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#fdc15a] text-black text-[10px] px-2 py-0.5 rounded font-black">
                  SEEDING OFICIAL
                </span>
                <span className="text-zinc-400 text-xs font-mono font-bold">
                  8 MAPAS // 2 INTENTOS POR MAPA
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-['ITCMachine'] text-white">
                CLASIFICACIÓN GENERAL QUALIFIERS (AVR RANK)
              </h2>
              <p className="text-zinc-400 text-xs mt-1 max-w-2xl leading-relaxed">
                El sistema <strong className="text-[#fdc15a]">AVR RANK (Average Rank)</strong> promedia la posición de cada jugador en los 8 mapas del pool. En cada mapa se toma el mejor puntaje de los 2 intentos (Run 1 y Run 2). En caso de empate en promedio de puesto, define el <strong className="text-white">Avg. Score</strong>.
              </p>

              {/* Leyenda de Seeding Tiers */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-white/5 text-[11px] font-sans">
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Tiers:</span>
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.5)]"></span>
                  Top Seed (1-8)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fdc15a] shadow-[0_0_6px_rgba(253,193,90,0.5)]"></span>
                  High Seed (9-16)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                  Mid Seed (17-24)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"></span>
                  Low Seed (25-32)
                </span>
              </div>
            </div>

            {/* Buscador de jugadores o equipos */}
            <div className="w-full md:w-72 flex-shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por jugador o equipo..."
                className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#fdc15a] transition-colors"
              />
            </div>
          </div>

          {/* Tabla de Seeding General */}
          <div className="bg-[#1a1a1a] rounded border border-white/5 overflow-hidden shadow-2xl p-3 sm:p-6">
            {/* Indicador de swipe horizontal */}
            <div className="flex md:hidden items-center justify-between text-zinc-400 text-[10px] tracking-wider uppercase font-bold px-1 mb-2">
              <span>Desliza para ver la tabla completa</span>
              <span className="text-[#fdc15a] font-mono">↔</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[1100px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/5">
                    <th className="pb-3 w-16 text-center">Seed</th>
                    <th className="pb-3 w-52">Jugador</th>
                    <th className="pb-3 w-36">Equipo</th>
                    <th className="pb-3 px-3 text-center whitespace-nowrap min-w-[90px]">AVR Rank</th>
                    <th className="pb-3 px-3 text-center whitespace-nowrap min-w-[100px]">Avg. Score</th>
                    <th className="pb-3 px-3 text-center whitespace-nowrap min-w-[100px]">Total Score</th>
                    {qualifierMaps.map((m) => (
                      <th key={m.id} className="pb-3 px-2 text-center w-24 whitespace-nowrap">
                        <span className="text-[#fdc15a] font-black">{m.pattern_type} {m.slot}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredQualifierLeaderboard.map((p) => {
                    let seedBadgeStyle = 'bg-white/5 text-zinc-400 border border-white/5';
                    let rowHighlight = '';
                    let tierTitle = '';

                    if (p.seed <= 8) {
                      seedBadgeStyle = 'bg-cyan-500 text-black font-black shadow-[0_0_8px_rgba(6,182,212,0.35)]';
                      rowHighlight = 'bg-cyan-500/[0.02]';
                      tierTitle = `Top Seed (Seed ${p.seed})`;
                    } else if (p.seed <= 16) {
                      seedBadgeStyle = 'bg-[#fdc15a] text-black font-black shadow-[0_0_8px_rgba(253,193,90,0.35)]';
                      rowHighlight = 'bg-[#fdc15a]/[0.02]';
                      tierTitle = `High Seed (Seed ${p.seed})`;
                    } else if (p.seed <= 24) {
                      seedBadgeStyle = 'bg-emerald-500 text-black font-black shadow-[0_0_8px_rgba(16,185,129,0.35)]';
                      rowHighlight = 'bg-emerald-500/[0.02]';
                      tierTitle = `Mid Seed (Seed ${p.seed})`;
                    } else if (p.seed <= 32) {
                      seedBadgeStyle = 'bg-blue-500 text-white font-black shadow-[0_0_8px_rgba(59,130,246,0.35)]';
                      rowHighlight = 'bg-blue-500/[0.02]';
                      tierTitle = `Low Seed (Seed ${p.seed})`;
                    }

                    return (
                      <tr key={p.player_id} className={`hover:bg-white/[0.03] transition-colors ${rowHighlight}`}>
                        {/* Seed */}
                        <td className="py-3 text-center">
                          <div
                            className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-xs ${seedBadgeStyle}`}
                            title={tierTitle}
                          >
                            {p.seed}
                          </div>
                        </td>

                        {/* Jugador */}
                        <td className="py-3">
                          <div className="flex items-center gap-2.5 group/player w-fit">
                            <a
                              href={p.osu_id ? `https://osu.ppy.sh/users/${p.osu_id}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0 hover:border-[#fdc15a] transition-colors"
                              title={`Ver perfil de osu! de ${p.nickname}`}
                            >
                              <img
                                src={p.avatar_url || (p.osu_id ? `https://a.ppy.sh/${p.osu_id}` : '/no-avatar.png')}
                                className="w-full h-full object-cover"
                                alt=""
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/no-avatar.png';
                                }}
                              />
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectedPlayerIdForStats(p.player_id)}
                              className="font-bold text-sm text-zinc-200 group-hover/player:text-[#fdc15a] hover:text-[#fdc15a] cursor-pointer transition-colors text-left"
                              title={`Ver historial completo y scores de ${p.nickname}`}
                            >
                              {p.nickname}
                            </button>
                          </div>
                        </td>

                        {/* Equipo */}
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {p.team_logo && (
                              <img src={p.team_logo} alt="" className="w-4 h-4 object-contain rounded-full" />
                            )}
                            <span className="text-xs text-zinc-400 truncate max-w-[130px]">
                              {p.team_name || 'Agente Libre'}
                            </span>
                          </div>
                        </td>

                        {/* AVR Rank */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-block bg-[#fdc15a]/10 text-[#fdc15a] border border-[#fdc15a]/20 font-mono font-black text-sm px-2.5 py-0.5 rounded-full">
                            {p.avgRank.toFixed(2)}
                          </span>
                        </td>

                        {/* Avg. Score */}
                        <td className="py-3 px-3 text-center font-mono text-xs font-bold text-zinc-200 whitespace-nowrap">
                          {Math.round(p.avgScore).toLocaleString()}
                        </td>

                        {/* Total Score */}
                        <td className="py-3 px-3 text-center font-mono text-xs text-zinc-400 whitespace-nowrap">
                          {p.totalScore.toLocaleString()}
                        </td>

                        {/* Puestos y scores de cada mapa */}
                        {qualifierMaps.map((m) => {
                          const mData = p.maps[m.id];
                          if (!mData) {
                            return (
                              <td key={m.id} className="py-3 text-center text-zinc-600 font-mono text-xs">
                                -
                              </td>
                            );
                          }

                          let rankColor = 'text-zinc-400';
                          if (mData.rank === 1) rankColor = 'text-[#fdc15a] font-black';
                          else if (mData.rank === 2) rankColor = 'text-slate-300 font-bold';
                          else if (mData.rank === 3) rankColor = 'text-amber-500 font-bold';

                          return (
                            <td key={m.id} className="py-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-xs font-mono ${rankColor}`}>
                                  #{mData.rank}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  {mData.bestScore.toLocaleString()}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : isQualifiers && qualifierView === 'maps' ? (
        /* CASO 2: VISTA DE QUALIFIERS POR MAPA CON RUN 1 Y RUN 2 */
        <div className="max-w-[1340px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
          {/* COLUMNA IZQUIERDA: Selector de Slots de Mapas de Qualifiers */}
          <div className="lg:col-span-3">
            <div className="bg-[#1a1a1a] p-4 rounded border border-white/5 shadow-xl mb-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">
                Mapas de Qualifiers
              </h3>

              {qualifierMaps.length === 0 ? (
                <p className="text-zinc-500 text-xs py-4 text-center">No hay mapas cargados</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                  {qualifierMaps.map((m) => {
                    const isSelected = mapaSeleccionado === m.id;
                    const patternColor = getPatternColor(m.pattern_type);

                    return (
                      <button
                        key={m.id}
                        onClick={() => setMapaSeleccionado(m.id)}
                        className={`relative flex items-center justify-between p-3 rounded border transition-all overflow-hidden ${
                          isSelected
                            ? 'bg-[#27272a] border-white/40 shadow-lg scale-[1.03] z-10'
                            : 'bg-black/50 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: patternColor }}
                        ></div>

                        <div className="flex items-center pl-2">
                          <span className="text-lg font-['ITCMachine'] text-white leading-none">
                            {m.pattern_type}
                            <span style={{ color: patternColor }}>{m.slot}</span>
                          </span>
                        </div>

                        <span
                          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-black font-mono"
                          style={{ backgroundColor: patternColor }}
                        >
                          {m.pattern_type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Detalle del Mapa y Leaderboard con Run 1 y Run 2 */}
          <div className="lg:col-span-9 space-y-6">
            {mapaData ? (
              <div className="bg-[#1a1a1a] rounded border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-300">
                {/* BANNER DEL MAPA */}
                <div className="relative min-h-[140px] w-full overflow-hidden flex flex-col justify-end p-6 border-b border-white/10">
                  <img
                    src={`https://assets.ppy.sh/beatmaps/${mapaData.banner_id}/covers/cover.jpg`}
                    className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[0.5px]"
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/70 to-transparent"></div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-black"
                          style={{ backgroundColor: getPatternColor(mapaData.pattern_type) }}
                        >
                          {mapaData.pattern_type} {mapaData.slot}
                        </span>
                        <span className="bg-[#fdc15a] text-black text-[10px] px-2 py-0.5 rounded font-black">
                          QUALIFIERS
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                        {mapaData.title}
                      </h2>
                      <p className="text-[#fdc15a] text-xs font-bold uppercase tracking-widest mt-0.5">
                        {mapaData.artist} // {mapaData.difficulty_name}
                      </p>
                    </div>

                    {/* Ficha técnica del mapa */}
                    <div className="flex items-center gap-3 bg-black/60 p-2.5 rounded border border-white/10 backdrop-blur-md text-xs font-mono">
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">SR</span>
                        <span className="text-[#fdc15a] font-bold">{mapaData.sr.toFixed(2)}★</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">BPM</span>
                        <span className="text-white font-bold">{mapaData.bpm}</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">DURACIÓN</span>
                        <span className="text-white font-bold">
                          {Math.floor(mapaData.length / 60)}:
                          {(mapaData.length % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">OD</span>
                        <span className="text-white font-bold">{mapaData.od}</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <a
                        href={`https://osu.ppy.sh/b/${mapaData.beatmap_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#fdc15a] hover:text-white transition-colors px-2"
                        title="Ver mapa en osu!"
                      >
                        <span className="font-sans font-black text-[10px] uppercase">OSU!</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* RESUMEN DEL MAPA */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-white/5 bg-black/20">
                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      High Score
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-[#fdc15a] mt-1">
                      {qualifierMapSummary.highScore > 0 ? qualifierMapSummary.highScore.toLocaleString() : '---'}
                    </span>
                    {qualifierMapSummary.bestPlayer && (
                      <span className="text-[10px] text-zinc-400 truncate mt-0.5">
                        por <strong className="text-white">{qualifierMapSummary.bestPlayer}</strong>
                      </span>
                    )}
                  </div>

                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Score Promedio
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-white mt-1">
                      {qualifierMapSummary.avgScore > 0 ? qualifierMapSummary.avgScore.toLocaleString() : '---'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Media del mapa</span>
                  </div>

                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Accuracy Promedio
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-[#67a4da] mt-1">
                      {qualifierMapSummary.avgAcc > 0 ? `${qualifierMapSummary.avgAcc}%` : '---'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Precisión media</span>
                  </div>

                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Jugadores
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-white mt-1">
                      {qualifierMapSummary.totalPlays}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Con registros</span>
                  </div>
                </div>

                {/* BUSCADOR Y TABLA CON RUN 1 Y RUN 2 */}
                <div className="p-6">
                  <div className="flex justify-end mb-6">
                    <div className="w-full sm:w-64">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filtrar por jugador o equipo..."
                        className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#fdc15a] transition-colors"
                      />
                    </div>
                  </div>

                  {qualifierMapPlayers.length > 0 ? (
                    <>
                      {/* Indicador de swipe horizontal */}
                      <div className="flex md:hidden items-center justify-between text-zinc-400 text-[10px] tracking-wider uppercase font-bold px-1 mb-2">
                        <span>Desliza para ver runs</span>
                        <span className="text-[#fdc15a] font-mono">↔</span>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[750px]">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/5">
                            <th className="pb-3 w-16 text-center">Rank</th>
                            <th className="pb-3 w-1/4">Jugador</th>
                            <th className="pb-3 w-1/6">Equipo</th>
                            <th className="pb-3 text-center">Mejor Score</th>
                            <th className="pb-3 text-center">Accuracy</th>
                            <th className="pb-3 text-center">Run 1</th>
                            <th className="pb-3 text-center">Run 2</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {qualifierMapPlayers.map((item, idx) => {
                            let rankStyles = 'bg-white/5 text-zinc-400';
                            let rowHighlight = '';
                            if (item.rankInMap === 1) {
                              rankStyles = 'bg-[#fdc15a] text-black shadow-[0_0_10px_rgba(253,193,90,0.5)] font-black';
                              rowHighlight = 'bg-[#fdc15a]/[0.02]';
                            } else if (item.rankInMap === 2) {
                              rankStyles = 'bg-slate-300 text-black shadow-[0_0_10px_rgba(203,213,225,0.4)] font-black';
                            } else if (item.rankInMap === 3) {
                              rankStyles = 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)] font-black';
                            }

                            const run1 = item.attempts[0];
                            const run2 = item.attempts[1];

                            const isRun1Best = run1 && run1.score === item.bestScore;
                            const isRun2Best = run2 && run2.score === item.bestScore;

                            const accFormatted =
                              item.bestAccuracy <= 1
                                ? (item.bestAccuracy * 100).toFixed(2)
                                : Number(item.bestAccuracy).toFixed(2);

                            return (
                              <tr key={item.player_id} className={`hover:bg-white/[0.03] transition-colors ${rowHighlight}`}>
                                {/* Rank en el mapa */}
                                <td className="py-4 text-center">
                                  <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-black text-xs ${rankStyles}`}>
                                    {item.rankInMap}
                                  </div>
                                </td>

                                {/* Jugador */}
                                <td className="py-4">
                                  <div className="flex items-center gap-3 group/player w-fit">
                                    <a
                                      href={item.osu_id ? `https://osu.ppy.sh/users/${item.osu_id}` : '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0 hover:border-[#fdc15a] transition-colors"
                                      title={`Ver perfil de osu! de ${item.nickname}`}
                                    >
                                      <img
                                        src={item.avatar_url || (item.osu_id ? `https://a.ppy.sh/${item.osu_id}` : '/no-avatar.png')}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/no-avatar.png';
                                        }}
                                      />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPlayerIdForStats(item.player_id)}
                                      className="font-bold text-zinc-200 group-hover/player:text-[#fdc15a] hover:text-[#fdc15a] cursor-pointer transition-colors text-left"
                                      title={`Ver historial completo y scores de ${item.nickname}`}
                                    >
                                      {item.nickname}
                                    </button>
                                  </div>
                                </td>

                                {/* Equipo */}
                                <td className="py-4 text-xs text-zinc-400 uppercase tracking-wider">
                                  {item.team_name || 'Agente Libre'}
                                </td>

                                {/* Mejor Score */}
                                <td className="py-4 text-center">
                                  <div className="inline-block bg-black/50 py-1.5 px-4 rounded-full border border-[#fdc15a]/20 shadow-inner font-mono font-black text-[15px] text-[#fdc15a]">
                                    {item.bestScore.toLocaleString()}
                                  </div>
                                </td>

                                {/* Accuracy */}
                                <td className="py-4 text-center font-mono text-sm font-bold text-zinc-200">
                                  {accFormatted}%
                                </td>

                                {/* Run 1 */}
                                <td className="py-4 text-center">
                                  {run1 ? (
                                    <div className="flex flex-col items-center">
                                      <span className={`font-mono text-xs ${isRun1Best ? 'text-[#fdc15a] font-bold' : 'text-zinc-400'}`}>
                                        {run1.score.toLocaleString()} {isRun1Best && '★'}
                                      </span>
                                      <span className="font-mono text-[10px] text-zinc-500">
                                        {(run1.accuracy <= 1 ? run1.accuracy * 100 : run1.accuracy).toFixed(2)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-600 font-mono text-xs">-</span>
                                  )}
                                </td>

                                {/* Run 2 */}
                                <td className="py-4 text-center">
                                  {run2 ? (
                                    <div className="flex flex-col items-center">
                                      <span className={`font-mono text-xs ${isRun2Best ? 'text-[#fdc15a] font-bold' : 'text-zinc-400'}`}>
                                        {run2.score.toLocaleString()} {isRun2Best && '★'}
                                      </span>
                                      <span className="font-mono text-[10px] text-zinc-500">
                                        {(run2.accuracy <= 1 ? run2.accuracy * 100 : run2.accuracy).toFixed(2)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-600 font-mono text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                    <div className="text-center py-16 border border-dashed border-white/5 rounded">
                      <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">
                        {searchQuery
                          ? `No se encontraron resultados para "${searchQuery}"`
                          : 'No hay scores registrados para este mapa'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 text-zinc-500 rounded">
                <span className="font-['ITCMachine'] text-2xl mb-2 opacity-20">SELECT MAP</span>
                <p className="text-[10px] uppercase tracking-widest font-bold">
                  Selecciona un slot del panel lateral para ver su leaderboard
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CASO 3: RONDAS 1VS1 (ROUND OF 16, QUARTERFINALS, ETC.) */
        <div className="max-w-[1340px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
          {/* COLUMNA IZQUIERDA: Selector de Slots de Mapas */}
          <div className="lg:col-span-3">
            <div className="bg-[#1a1a1a] p-4 rounded border border-white/5 shadow-xl mb-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">
                Mapas de {rondaActual}
              </h3>

              {mapasRonda.length === 0 ? (
                <p className="text-zinc-500 text-xs py-4 text-center">No hay mapas cargados</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                  {mapasRonda.map((m) => {
                    const isSelected = mapaSeleccionado === m.id;
                    const patternColor = getPatternColor(m.pattern_type);

                    return (
                      <button
                        key={m.id}
                        onClick={() => setMapaSeleccionado(m.id)}
                        className={`relative flex items-center justify-between p-3 rounded border transition-all overflow-hidden ${
                          isSelected
                            ? 'bg-[#27272a] border-white/40 shadow-lg scale-[1.03] z-10'
                            : 'bg-black/50 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {/* Barrita izquierda del color del patrón */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: patternColor }}
                        ></div>

                        <div className="flex items-center pl-2">
                          <span className="text-lg font-['ITCMachine'] text-white leading-none">
                            {m.pattern_type}
                            <span style={{ color: patternColor }}>{m.slot}</span>
                          </span>
                        </div>

                        <span
                          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-black font-mono"
                          style={{ backgroundColor: patternColor }}
                        >
                          {m.pattern_type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Contenido del Mapa y Leaderboard */}
          <div className="lg:col-span-9 space-y-6">
            {mapaData ? (
              <div className="bg-[#1a1a1a] rounded border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-300">
                {/* BANNER ENRIQUECIDO DEL MAPA */}
                <div className="relative min-h-[140px] w-full overflow-hidden flex flex-col justify-end p-6 border-b border-white/10">
                  <img
                    src={`https://assets.ppy.sh/beatmaps/${mapaData.banner_id}/covers/cover.jpg`}
                    className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[0.5px]"
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/70 to-transparent"></div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-black"
                          style={{ backgroundColor: getPatternColor(mapaData.pattern_type) }}
                        >
                          {mapaData.pattern_type} {mapaData.slot}
                        </span>
                        {mapaData.is_custom_song && (
                          <span className="bg-[#fdc15a] text-black text-[10px] px-2 py-0.5 rounded font-black">
                            ORIGINAL SONG
                          </span>
                        )}
                        {mapaData.is_custom_map && !mapaData.is_custom_song && (
                          <span className="border border-[#fdc15a] text-[#fdc15a] text-[10px] px-2 py-0.5 rounded font-black">
                            CUSTOM MAP
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                        {mapaData.title}
                      </h2>
                      <p className="text-[#fdc15a] text-xs font-bold uppercase tracking-widest mt-0.5">
                        {mapaData.artist} // {mapaData.difficulty_name}
                      </p>
                    </div>

                    {/* Ficha técnica del mapa */}
                    <div className="flex items-center gap-3 bg-black/60 p-2.5 rounded border border-white/10 backdrop-blur-md text-xs font-mono">
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">SR</span>
                        <span className="text-[#fdc15a] font-bold">{mapaData.sr.toFixed(2)}★</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">BPM</span>
                        <span className="text-white font-bold">{mapaData.bpm}</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">DURACIÓN</span>
                        <span className="text-white font-bold">
                          {Math.floor(mapaData.length / 60)}:
                          {(mapaData.length % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-sans font-bold">OD</span>
                        <span className="text-white font-bold">{mapaData.od}</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10"></div>
                      <a
                        href={`https://osu.ppy.sh/b/${mapaData.beatmap_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#fdc15a] hover:text-white transition-colors px-2"
                        title="Ver mapa en osu!"
                      >
                        <span className="font-sans font-black text-[10px] uppercase">OSU!</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* TARJETAS DE RESUMEN (QUICK STATS) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-white/5 bg-black/20">
                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      High Score
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-[#fdc15a] mt-1">
                      {summaryStats.highScore > 0 ? summaryStats.highScore.toLocaleString() : '---'}
                    </span>
                    {summaryStats.bestPlayer && (
                      <span className="text-[10px] text-zinc-400 truncate mt-0.5">
                        por <strong className="text-white">{summaryStats.bestPlayer}</strong>
                      </span>
                    )}
                  </div>

                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Score Promedio
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-white mt-1">
                      {summaryStats.avgScore > 0 ? summaryStats.avgScore.toLocaleString() : '---'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Media general</span>
                  </div>

                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Accuracy Promedio
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-[#67a4da] mt-1">
                      {summaryStats.avgAcc > 0 ? `${summaryStats.avgAcc}%` : '---'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Precisión de acierto</span>
                  </div>

                  <div className="bg-[#121212] p-3.5 rounded border border-white/5 flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Partidas Jugadas
                    </span>
                    <span className="font-['ITCMachine'] text-2xl text-white mt-1">
                      {summaryStats.totalMatches ?? Math.ceil(summaryStats.totalPlays / 2)}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      {summaryStats.totalPlays} scores registrados
                    </span>
                  </div>
                </div>

                {/* FILTROS Y BUSCADOR DEL LEADERBOARD */}
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    {/* Botones de ordenamiento por estadística */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setStatFilter('score')}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded transition-all ${
                          statFilter === 'score'
                            ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Score
                      </button>
                      <button
                        onClick={() => setStatFilter('accuracy')}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded transition-all ${
                          statFilter === 'accuracy'
                            ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Accuracy
                      </button>
                      <button
                        onClick={() => setStatFilter('marvelous_rate')}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded transition-all ${
                          statFilter === 'marvelous_rate'
                            ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        % Marv
                      </button>
                      <button
                        onClick={() => setStatFilter('mapa_ratio')}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded transition-all ${
                          statFilter === 'mapa_ratio'
                            ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        MA/PA Ratio
                      </button>
                      <button
                        onClick={() => setStatFilter('error_rate')}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded transition-all ${
                          statFilter === 'error_rate'
                            ? 'bg-red-500 text-white shadow-[0_0_10px_#ef4444]'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Error Rate
                      </button>
                    </div>

                    {/* Buscador de jugadores / equipos */}
                    <div className="w-full sm:w-64">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filtrar por jugador o equipo..."
                        className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#fdc15a] transition-colors"
                      />
                    </div>
                  </div>

                  {/* TABLA DE LEADERBOARD */}
                  {filteredScores.length > 0 ? (
                    <>
                      {/* Indicador de swipe horizontal */}
                      <div className="flex md:hidden items-center justify-between text-zinc-400 text-[10px] tracking-wider uppercase font-bold px-1 mb-2">
                        <span>Desliza para ver judgments</span>
                        <span className="text-[#fdc15a] font-mono">↔</span>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/5">
                            <th className="pb-3 w-16 text-center">Rank</th>
                            <th className="pb-3 w-1/4">Jugador</th>
                            <th className="pb-3 w-1/6">Equipo</th>
                            <th className="pb-3 text-center">Judgments (M/P/G/G/B/M)</th>
                            <th className="pb-3 text-center">MP</th>
                            <th className="pb-3 text-center">
                              {statFilter === 'score' && 'Score'}
                              {statFilter === 'accuracy' && 'Accuracy'}
                              {statFilter === 'marvelous_rate' && 'Marvelous %'}
                              {statFilter === 'mapa_ratio' && 'MA/PA Ratio'}
                              {statFilter === 'error_rate' && 'Error Rate %'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredScores.map((s, idx) => {
                            const accFormateada =
                              s.accuracy <= 1
                                ? (s.accuracy * 100).toFixed(2)
                                : Number(s.accuracy).toFixed(2);

                            // Estilos y medallas para el podio
                            let rankStyles = 'bg-white/5 text-zinc-400';
                            let rowHighlight = '';
                            if (idx === 0) {
                              rankStyles =
                                'bg-[#fdc15a] text-black shadow-[0_0_10px_rgba(253,193,90,0.5)]';
                              rowHighlight = 'bg-[#fdc15a]/[0.02]';
                            } else if (idx === 1) {
                              rankStyles =
                                'bg-slate-300 text-black shadow-[0_0_10px_rgba(203,213,225,0.4)]';
                            } else if (idx === 2) {
                              rankStyles =
                                'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]';
                            }

                            const statTextColor =
                              statFilter === 'error_rate' ? 'text-red-400' : 'text-[#fdc15a]';

                            return (
                              <tr key={idx} className={`hover:bg-white/[0.03] transition-colors ${rowHighlight}`}>
                                {/* Posición en el ranking */}
                                <td className="py-4 text-center">
                                  <div
                                    className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-black text-xs ${rankStyles}`}
                                  >
                                    {idx + 1}
                                  </div>
                                </td>

                                {/* Jugador con Avatar y Link */}
                                <td className="py-4">
                                  <div className="flex items-center gap-3 group/player w-fit">
                                    <a
                                      href={
                                        s.osu_id
                                          ? `https://osu.ppy.sh/users/${s.osu_id}`
                                          : '#'
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0 hover:border-[#fdc15a] transition-colors"
                                      title={`Ver perfil de osu! de ${s.nickname}`}
                                    >
                                      <img
                                        src={
                                          s.avatar_url ||
                                          (s.osu_id
                                            ? `https://a.ppy.sh/${s.osu_id}`
                                            : '/no-avatar.png')
                                        }
                                        className="w-full h-full object-cover"
                                        alt=""
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/no-avatar.png';
                                        }}
                                      />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPlayerIdForStats(s.player_id || s.id || null)}
                                      className="font-bold text-zinc-200 group-hover/player:text-[#fdc15a] hover:text-[#fdc15a] cursor-pointer transition-colors text-left"
                                      title={`Ver historial completo y scores de ${s.nickname}`}
                                    >
                                      {s.nickname}
                                    </button>
                                  </div>
                                </td>

                                {/* Equipo */}
                                <td className="py-4 text-xs text-zinc-400 uppercase tracking-wider">
                                  {s.team || 'Agente Libre'}
                                </td>

                                {/* Judgments M/P/G/G/B/M */}
                                <td className="py-4 text-center">
                                  <div className="flex items-center justify-center gap-3 text-[12px] font-bold font-mono bg-black/40 py-2 px-5 rounded-full border border-white/5 w-fit mx-auto shadow-inner">
                                    <span className="text-cyan-300" title="Marvelous">
                                      {s.judgments.m}
                                    </span>
                                    <span className="text-white/10 font-light">|</span>
                                    <span className="text-yellow-200" title="Perfect">
                                      {s.judgments.pft}
                                    </span>
                                    <span className="text-white/10 font-light">|</span>
                                    <span className="text-emerald-300" title="Great">
                                      {s.judgments.g}
                                    </span>
                                    <span className="text-white/10 font-light">|</span>
                                    <span className="text-orange-300" title="Good">
                                      {s.judgments.go}
                                    </span>
                                    <span className="text-white/10 font-light">|</span>
                                    <span className="text-rose-300" title="Bad">
                                      {s.judgments.b}
                                    </span>
                                    <span className="text-white/10 font-light">|</span>
                                    <span className="text-zinc-500" title="Miss">
                                      {s.judgments.mi}
                                    </span>
                                  </div>
                                </td>

                                {/* MP Link */}
                                <td className="py-4 text-center px-4">
                                  {s.mp_link ? (
                                    <a
                                      href={
                                        s.mp_link.startsWith('http')
                                          ? s.mp_link
                                          : `https://osu.ppy.sh/community/matches/${s.mp_link}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-zinc-500 hover:text-[#fdc15a] transition-colors p-1 inline-block"
                                      title="Ver sala de osu!"
                                    >
                                      <svg
                                        className="w-4 h-4 mx-auto"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                    </a>
                                  ) : (
                                    <span className="text-white/10 text-xs">-</span>
                                  )}
                                </td>

                                {/* Valor de la estadística seleccionada */}
                                <td className="py-4 text-center">
                                  <div
                                    className={`inline-block min-w-[130px] text-center bg-black/50 py-2 px-4 rounded-full border border-white/5 shadow-inner font-mono font-black text-[14px] ${
                                      idx === 0 ? statTextColor : 'text-zinc-200'
                                    }`}
                                  >
                                    {statFilter === 'score' && s.score.toLocaleString()}
                                    {statFilter === 'accuracy' && `${accFormateada}%`}
                                    {statFilter === 'marvelous_rate' &&
                                      `${s.marvelous_rate.toFixed(2)}%`}
                                    {statFilter === 'mapa_ratio' && s.mapa_ratio.toFixed(2)}
                                    {statFilter === 'error_rate' && `${s.error_rate.toFixed(2)}%`}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                    <div className="text-center py-16 border border-dashed border-white/5 rounded">
                      <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">
                        {searchQuery
                          ? `No se encontraron resultados para "${searchQuery}"`
                          : `No hay scores registrados para este mapa en ${rondaActual}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 text-zinc-500 rounded">
                <span className="font-['ITCMachine'] text-2xl mb-2 opacity-20">SELECT MAP</span>
                <p className="text-[10px] uppercase tracking-widest font-bold">
                  Selecciona un slot del panel lateral para ver su leaderboard
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE HISTORIAL DE SCORES Y ESTADÍSTICAS */}
      <PlayerScoresModal
        playerId={selectedPlayerIdForStats}
        onClose={() => setSelectedPlayerIdForStats(null)}
        onSelectPlayer={(id) => setSelectedPlayerIdForStats(id)}
      />
    </main>
  );
}

export default function EstadisticasPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#2e2e2e] flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-white/10 border-t-[#fdc15a] rounded-full animate-spin"></div>
          <div className="font-['ITCMachine'] text-[#fdc15a] text-3xl md:text-4xl animate-pulse tracking-widest drop-shadow-[0_0_15px_rgba(253,193,90,0.4)]">
            CARGANDO ESTADÍSTICAS...
          </div>
        </main>
      }
    >
      <EstadisticasContent />
    </Suspense>
  );
}