'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import PlayerScoresModal from '../../components/PlayerScoresModal';

const AWARDS_STAGES = [
  'ROUND OF 16',
  'QUARTERFINALS',
  'QUARTERFINALS R1',
  'QUARTERFINALS R2',
  'SEMIFINALS',
  'SEMIFINALS R1',
  'SEMIFINALS R2',
  'FINALS',
  'FINALS R1',
  'FINALS R2',
  'GRAND FINALS',
  'GRAND FINALS R1',
];

const formatStage = (s: string) => {
  const stageMap: Record<string, string> = {
    'ROUND OF 16': 'RO16',
    'QUARTERFINALS': 'QF',
    'SEMIFINALS': 'SF',
    'FINALS': 'F',
    'GRAND FINALS': 'GF',
  };
  return stageMap[s] || s;
};

const CATEGORIES = [
  { id: 'ALL', label: 'TODOS LOS PREMIOS' },
  { id: 'INDIVIDUALES', label: 'PREMIOS INDIVIDUALES' },
  { id: 'EPICOS', label: 'MOMENTOS INCHEQUEABLES' },
  { id: 'PATRONES', label: 'REY DE LOS PATRONES' },
  { id: 'EQUIPOS', label: 'PREMIOS POR EQUIPOS' },
];

export interface LeaderboardEntry {
  rank: number;
  playerId?: string;
  name: string;
  avatar?: string | null;
  team?: string | null;
  formattedValue: string;
  value?: string;
  detail?: string;
}

let awardsCache: any[] | null = null;

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

export default function AwardsPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<string | null>(null);

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    document.title = 'Awards | CNARG 4K 2026';

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pParam = params.get('player') || params.get('p');
      if (pParam) {
        setSelectedPlayerForStats(pParam);
      }
    }
    async function fetchAwardsData() {
      if (awardsCache) {
        setRawData(awardsCache);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await fetchWithRetry(() =>
          supabase
            .from('match_map_results')
            .select(`
              *,
              match:match_id (stage),
              map:map_id (title, pattern_type, slot, banner_id, stages(name)),
              player1:player_1_id(id, nickname, avatar_url, team:team_id(name, logo_url)),
              player2:player_2_id(id, nickname, avatar_url, team:team_id(name, logo_url))
            `)
        );

        if (data) {
          const filteredData = data.filter((r: any) => {
            const mapStage = r.map?.stages?.name?.toUpperCase().trim() || '';
            const matchStage = r.match?.stage?.toUpperCase().trim() || '';
            return AWARDS_STAGES.includes(mapStage) || AWARDS_STAGES.includes(matchStage);
          });
          awardsCache = filteredData;
          setRawData(filteredData);
        }
      } catch (err) {
        console.error('Error cargando awards:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAwardsData();
  }, []);

  const winners = useMemo(() => {
    if (rawData.length === 0) return null;

    const playerStats: Record<string, any> = {};
    const teamStats: Record<string, any> = {};

    const addStat = (
      player: any,
      type: string,
      score: number,
      acc: number,
      m: number,
      pft: number,
      g: number,
      go: number,
      b: number,
      mi: number,
      mapInfo: string,
      mapBanner: string,
      stageName: string,
      isWinner: boolean,
      scoreDiff: number
    ) => {
      if (!player?.id) return;

      if (!playerStats[player.id]) {
        playerStats[player.id] = {
          player,
          stageMisses: {},
          ALL: {
            score: 0,
            maps: 0,
            mapsWithStats: 0,
            mapsWon: 0,
            m: 0,
            pft: 0,
            mi: 0,
            totalHits: 0,
            accSum: 0,
            accCount: 0,
            minDiff: Infinity,
            minDiffMap: '',
            minDiffBanner: '',
            maxDiff: 0,
            maxDiffMap: '',
            maxDiffBanner: '',
          },
          RC: { score: 0, maps: 0, maxScore: 0, maxMap: '', maxBanner: '' },
          LN: { score: 0, maps: 0, maxScore: 0, maxMap: '', maxBanner: '' },
          HB: { score: 0, maps: 0, maxScore: 0, maxMap: '', maxBanner: '' },
          SV: { score: 0, maps: 0, maxScore: 0, maxMap: '', maxBanner: '' },
        };
      }

      const totalHits = (m || 0) + (pft || 0) + (g || 0) + (go || 0) + (b || 0) + (mi || 0);
      const st = playerStats[player.id];

      st.ALL.score += score || 0;
      st.ALL.maps += 1;

      if (acc > 0) {
        st.ALL.accSum += acc;
        st.ALL.accCount += 1;
      }

      if (isWinner) {
        st.ALL.mapsWon += 1;
        if (scoreDiff > 0) {
          if (scoreDiff < st.ALL.minDiff) {
            st.ALL.minDiff = scoreDiff;
            st.ALL.minDiffMap = mapInfo;
            st.ALL.minDiffBanner = mapBanner;
          }
          if (scoreDiff > st.ALL.maxDiff) {
            st.ALL.maxDiff = scoreDiff;
            st.ALL.maxDiffMap = mapInfo;
            st.ALL.maxDiffBanner = mapBanner;
          }
        }
      }

      if (totalHits > 0) {
        st.ALL.mapsWithStats += 1;
        st.ALL.m += m || 0;
        st.ALL.pft += pft || 0;
        st.ALL.mi += mi || 0;
        st.ALL.totalHits += totalHits;

        if (!st.stageMisses[stageName]) st.stageMisses[stageName] = 0;
        st.stageMisses[stageName] += mi || 0;
      }

      if (st[type]) {
        st[type].score += score || 0;
        st[type].maps += 1;
        if ((score || 0) > st[type].maxScore) {
          st[type].maxScore = score || 0;
          st[type].maxMap = mapInfo;
          st[type].maxBanner = mapBanner;
        }
      }

      const teamData = player.team;
      if (teamData && teamData.name) {
        const teamName = teamData.name;
        if (!teamStats[teamName]) {
          teamStats[teamName] = {
            name: teamName,
            logo_url: teamData.logo_url,
            players: {},
            ALL: { score: 0, maps: 0 },
            RC: { score: 0, maps: 0 },
            LN: { score: 0, maps: 0 },
            HB: { score: 0, maps: 0 },
            SV: { score: 0, maps: 0 },
          };
        }

        const tStat = teamStats[teamName];
        tStat.ALL.score += score || 0;
        tStat.ALL.maps += 1;

        if (!tStat.players[player.nickname]) tStat.players[player.nickname] = 0;
        tStat.players[player.nickname] += 1;

        if (tStat[type]) {
          tStat[type].score += score || 0;
          tStat[type].maps += 1;
        }
      }
    };

    rawData.forEach((r) => {
      const type = r.map?.pattern_type;
      const mapInfo = r.map ? `${r.map.pattern_type}${r.map.slot} - ${r.map.title || 'Unknown'}` : 'Unknown';
      const mapBanner = r.map?.banner_id || '';

      const mapStage = r.map?.stages?.name?.toUpperCase().trim() || '';
      const matchStage = r.match?.stage?.toUpperCase().trim() || '';
      const baseStageName = (mapStage || matchStage || 'UNKNOWN').replace(' R1', '').replace(' R2', '').trim();

      const score1 = r.score_1 || 0;
      const score2 = r.score_2 || 0;
      const p1Wins = score1 > score2;
      const p2Wins = score2 > score1;
      const isValidForDiff = score1 > 0 && score2 > 0;
      const scoreDiff = isValidForDiff ? Math.abs(score1 - score2) : 0;

      const acc1 = r.p1_accuracy || r.accuracy_1 || 0;
      const acc2 = r.p2_accuracy || r.accuracy_2 || 0;

      addStat(
        r.player1,
        type,
        score1,
        acc1,
        r.p1_marvelous,
        r.p1_perfects,
        r.p1_greats,
        r.p1_goods,
        r.p1_bads,
        r.p1_misses,
        mapInfo,
        mapBanner,
        baseStageName,
        p1Wins,
        scoreDiff
      );
      addStat(
        r.player2,
        type,
        score2,
        acc2,
        r.p2_marvelous,
        r.p2_perfects,
        r.p2_greats,
        r.p2_goods,
        r.p2_bads,
        r.p2_misses,
        mapInfo,
        mapBanner,
        baseStageName,
        p2Wins,
        scoreDiff
      );
    });

    const players = Object.values(playerStats);
    const statsPlayers = players.filter((p) => p.ALL.mapsWithStats >= 1);

    // ================= PROMEDIOS GLOBALES PARA PONDERACIÓN BAYESIANA =================
    // Accuracy global
    const globalTotalAccSum = statsPlayers.reduce((sum, p) => {
      const raw = p.ALL.accCount > 0 ? p.ALL.accSum / p.ALL.accCount : 0;
      return sum + (raw <= 1 ? raw * 100 : raw);
    }, 0);
    const globalAvgAcc = statsPlayers.length > 0 ? globalTotalAccSum / statsPlayers.length : 97.0;

    // Ratio MA/PA global
    const globalTotalRatioSum = statsPlayers.reduce((sum, p) => {
      return sum + (p.ALL.pft > 0 ? p.ALL.m / p.ALL.pft : p.ALL.m);
    }, 0);
    const globalAvgRatio = statsPlayers.length > 0 ? globalTotalRatioSum / statsPlayers.length : 4.0;

    // Miss Rate global
    const globalTotalMissRateSum = statsPlayers.reduce((sum, p) => {
      return sum + (p.ALL.totalHits > 0 ? (p.ALL.mi / p.ALL.totalHits) * 100 : 0);
    }, 0);
    const globalAvgMissRate = statsPlayers.length > 0 ? globalTotalMissRateSum / statsPlayers.length : 1.5;

    // ================= CÁLCULOS PONDERADOS INDIVIDUALES =================

    // 1. MEJOR RATIO (MA/PA) - Ponderación de volumen y consistencia
    const getBestRatio = () => {
      if (statsPlayers.length === 0) return null;
      const sorted = [...statsPlayers]
        .map((p) => {
          const v = p.ALL.mapsWithStats;
          const realRatio = p.ALL.pft > 0 ? p.ALL.m / p.ALL.pft : p.ALL.m;
          const bayesian = (v / (v + 6)) * realRatio + (6 / (v + 6)) * globalAvgRatio;
          const weightedScore = bayesian * (1 + 0.003 * (v - 1));
          return { p, v, realRatio, weightedScore };
        })
        .sort((a, b) => b.weightedScore - a.weightedScore);

      const best = sorted[0];
      const leaderboard: LeaderboardEntry[] = sorted.map((item, idx) => {
        return {
          rank: idx + 1,
          playerId: item.p.player.id,
          name: item.p.player.nickname,
          avatar: item.p.player.avatar_url,
          team: item.p.player.team?.name,
          formattedValue: `${item.realRatio.toFixed(2)} (${item.v} mapas)`,
          value: item.realRatio.toFixed(2),
          detail: `${item.v} mapas`,
        };
      });

      return {
        winner: best.p.player,
        value: best.realRatio.toFixed(2),
        label: 'MA/PA Ratio General',
        leaderboard,
      };
    };

    // 2. MÁS CONSISTENTE (MENOR MISS RATE) - Ponderación de volumen (menor miss en mayor cantidad de mapas)
    const getBestMiss = () => {
      if (statsPlayers.length === 0) return null;
      const sorted = [...statsPlayers]
        .map((p) => {
          const v = p.ALL.mapsWithStats;
          const realMissRate = (p.ALL.mi / p.ALL.totalHits) * 100;
          const bayesian = (v / (v + 6)) * realMissRate + (6 / (v + 6)) * globalAvgMissRate;
          const weightedMiss = bayesian / (1 + 0.004 * (v - 1));
          return { p, v, realMissRate, weightedMiss, totalMisses: p.ALL.mi };
        })
        .sort((a, b) => a.weightedMiss - b.weightedMiss);

      const best = sorted[0];
      const leaderboard: LeaderboardEntry[] = sorted.map((item, idx) => {
        return {
          rank: idx + 1,
          playerId: item.p.player.id,
          name: item.p.player.nickname,
          avatar: item.p.player.avatar_url,
          team: item.p.player.team?.name,
          formattedValue: `${item.realMissRate.toFixed(2)}% (${item.totalMisses}m • ${item.v} mapas)`,
          value: `${item.realMissRate.toFixed(2)}%`,
          detail: `${item.totalMisses}m • ${item.v} mapas`,
        };
      });

      return {
        winner: best.p.player,
        value: `${best.realMissRate.toFixed(2)}%`,
        label: 'Miss Rate General',
        totalMisses: best.p.ALL.mi,
        mapsCount: best.p.ALL.mapsWithStats,
        stageMisses: best.p.stageMisses,
        leaderboard,
      };
    };

    // 3. MÁXIMO ANOTADOR (MAPAS GANADOS / MVP)
    const getBestWins = () => {
      if (players.length === 0) return null;
      const sorted = [...players]
        .filter((p) => p.ALL.mapsWon > 0)
        .sort((a, b) => {
          if (b.ALL.mapsWon !== a.ALL.mapsWon) return b.ALL.mapsWon - a.ALL.mapsWon;
          const wrA = a.ALL.mapsWon / a.ALL.maps;
          const wrB = b.ALL.mapsWon / b.ALL.maps;
          return wrB - wrA;
        });
      if (sorted.length === 0) return null;
      const best = sorted[0];

      const leaderboard: LeaderboardEntry[] = sorted.map((p, idx) => {
        const wr = Math.round((p.ALL.mapsWon / p.ALL.maps) * 100);
        return {
          rank: idx + 1,
          playerId: p.player.id,
          name: p.player.nickname,
          avatar: p.player.avatar_url,
          team: p.player.team?.name,
          formattedValue: `${p.ALL.mapsWon}W (${wr}% • ${p.ALL.maps} mapas)`,
          value: `${p.ALL.mapsWon}W`,
          detail: `${wr}% WR • ${p.ALL.maps} mapas`,
        };
      });

      return {
        winner: best.player,
        value: best.ALL.mapsWon.toString(),
        label: 'Mapas Ganados',
        winRate: Math.round((best.ALL.mapsWon / best.ALL.maps) * 100),
        leaderboard,
      };
    };

    // 4. EL METRÓNOMO (MEJOR ACCURACY PROMEDIO) - Ponderación Bayesiana y Volumen
    const getBestAcc = () => {
      if (statsPlayers.length === 0) return null;
      const sorted = [...statsPlayers]
        .map((p) => {
          const v = p.ALL.accCount;
          const rawAcc = p.ALL.accCount > 0 ? p.ALL.accSum / p.ALL.accCount : 0;
          const realAcc = rawAcc <= 1 ? rawAcc * 100 : rawAcc;
          const bayesian = (v / (v + 8)) * realAcc + (8 / (v + 8)) * globalAvgAcc;
          const weightedAcc = bayesian * (1 + 0.001 * (v - 1));
          return { p, v, realAcc, weightedAcc };
        })
        .sort((a, b) => b.weightedAcc - a.weightedAcc);

      const best = sorted[0];
      const leaderboard: LeaderboardEntry[] = sorted.map((item, idx) => {
        return {
          rank: idx + 1,
          playerId: item.p.player.id,
          name: item.p.player.nickname,
          avatar: item.p.player.avatar_url,
          team: item.p.player.team?.name,
          formattedValue: `${item.realAcc.toFixed(2)}% (${item.v} mapas)`,
          value: `${item.realAcc.toFixed(2)}%`,
          detail: `${item.v} mapas`,
        };
      });

      return {
        winner: best.p.player,
        value: `${best.realAcc.toFixed(2)}%`,
        label: 'Avg Accuracy General',
        leaderboard,
      };
    };

    // 5. EL IRON MAN (MAPAS TOTALES DISPUTADOS)
    const getIronMan = () => {
      if (players.length === 0) return null;
      const sorted = [...players].sort((a, b) => b.ALL.maps - a.ALL.maps);
      const best = sorted[0];

      const leaderboard: LeaderboardEntry[] = sorted.map((p, idx) => {
        return {
          rank: idx + 1,
          playerId: p.player.id,
          name: p.player.nickname,
          avatar: p.player.avatar_url,
          team: p.player.team?.name,
          formattedValue: `${p.ALL.maps} mapas`,
          value: `${p.ALL.maps} mapas`,
          detail: 'Disputados',
        };
      });

      return {
        winner: best.player,
        value: best.ALL.maps.toString(),
        label: 'Mapas Totales Jugados',
        leaderboard,
      };
    };

    // 6. EL CLUTCH EXTREMO (MENOR DIFERENCIA A FAVOR)
    const getClutch = () => {
      const sorted = [...players]
        .filter((p) => p.ALL.minDiff < Infinity && p.ALL.minDiff > 0)
        .sort((a, b) => a.ALL.minDiff - b.ALL.minDiff);
      if (sorted.length === 0) return null;
      const best = sorted[0];

      const leaderboard: LeaderboardEntry[] = sorted.map((p, idx) => {
        return {
          rank: idx + 1,
          playerId: p.player.id,
          name: p.player.nickname,
          avatar: p.player.avatar_url,
          team: p.player.team?.name,
          formattedValue: `+${p.ALL.minDiff.toLocaleString()}`,
          value: `+${p.ALL.minDiff.toLocaleString()}`,
          detail: 'Diferencia mínima',
        };
      });

      return {
        winner: best.player,
        value: `+${best.ALL.minDiff.toLocaleString()}`,
        label: 'Diferencia Mínima a Favor',
        highlightTitle: 'Ganó de milagro en',
        highlightValue: best.ALL.minDiff,
        highlightMap: best.ALL.minDiffMap,
        highlightBanner: best.ALL.minDiffBanner,
        leaderboard,
      };
    };

    // 7. LA MAYOR PALIZA (MAYOR DIFERENCIA A FAVOR)
    const getPaliza = () => {
      const sorted = [...players]
        .filter((p) => p.ALL.maxDiff > 0)
        .sort((a, b) => b.ALL.maxDiff - a.ALL.maxDiff);
      if (sorted.length === 0) return null;
      const best = sorted[0];

      const leaderboard: LeaderboardEntry[] = sorted.map((p, idx) => {
        return {
          rank: idx + 1,
          playerId: p.player.id,
          name: p.player.nickname,
          avatar: p.player.avatar_url,
          team: p.player.team?.name,
          formattedValue: `+${p.ALL.maxDiff.toLocaleString()}`,
          value: `+${p.ALL.maxDiff.toLocaleString()}`,
          detail: 'Diferencia máxima',
        };
      });

      return {
        winner: best.player,
        value: `+${best.ALL.maxDiff.toLocaleString()}`,
        label: 'Diferencia Máxima a Favor',
        highlightTitle: 'Don Anti-Clutch en',
        highlightValue: best.ALL.maxDiff,
        highlightMap: best.ALL.maxDiffMap,
        highlightBanner: best.ALL.maxDiffBanner,
        leaderboard,
      };
    };

    // 8. PREMIOS POR MOD INDIVIDUAL - Ponderación Bayesiana y Escala de Volumen Robusta
    const getPlayerMod = (mod: string, label: string) => {
      const modPlayers = players.filter((p) => p[mod] && p[mod].maps >= 1);
      if (modPlayers.length === 0) return { winner: null, value: 'N/A', label, leaderboard: [] };

      const globalModSum = modPlayers.reduce((sum, p) => sum + p[mod].score / p[mod].maps, 0);
      const globalAvgMod = globalModSum / modPlayers.length;
      const volWeight = mod === 'SV' ? 0.025 : 0.005;
      const m = mod === 'SV' ? 5 : 6;

      const sorted = [...modPlayers]
        .map((p) => {
          const v = p[mod].maps;
          const realAvg = p[mod].score / p[mod].maps;
          const bayesian = (v / (v + m)) * realAvg + (m / (v + m)) * globalAvgMod;
          const weightedMod = bayesian * (1 + volWeight * (v - 1));
          return { p, v, realAvg, weightedMod };
        })
        .sort((a, b) => b.weightedMod - a.weightedMod);

      const best = sorted[0];
      const leaderboard: LeaderboardEntry[] = sorted.map((item, idx) => {
        return {
          rank: idx + 1,
          playerId: item.p.player.id,
          name: item.p.player.nickname,
          avatar: item.p.player.avatar_url,
          team: item.p.player.team?.name,
          formattedValue: `${Math.round(item.realAvg).toLocaleString()} (${item.v} mapas)`,
          value: Math.round(item.realAvg).toLocaleString(),
          detail: `${item.v} mapas`,
        };
      });

      return {
        winner: best.p.player,
        value: Math.round(best.realAvg).toLocaleString(),
        label: `Avg Score en ${label}`,
        highlightTitle: 'Mejor Score Obtenido',
        highlightValue: best.p[mod].maxScore,
        highlightMap: best.p[mod].maxMap,
        highlightBanner: best.p[mod].maxBanner,
        leaderboard,
      };
    };

    // ================= CÁLCULOS EQUIPOS (RANGO Y VOLUMEN ROBUSTO) =================
    const teams = Object.values(teamStats);

    // 9. TEAM EQUILIBRADO - Favorece volumen y balance real del torneo
    const getTeamBalanced = () => {
      // Exigimos al menos 4 mapas totales y ambos jugadores con participación
      const validBalancedTeams = teams.filter((t) => Object.keys(t.players).length > 1 && t.ALL.maps >= 4);
      if (validBalancedTeams.length === 0) return null;

      const sorted = [...validBalancedTeams]
        .map((t) => {
          const v = t.ALL.maps;
          const avgScore = t.ALL.score / t.ALL.maps;
          const playerCounts = Object.values(t.players).sort((x: any, y: any) => y - x);
          const minP = playerCounts[1] as number;
          const maxP = playerCounts[0] as number;
          const share = minP / (minP + maxP);
          // Si ambos jugaron al menos un 35% de los mapas del equipo, sinergia plena (1.0). Si no, escala proporcional.
          const synergy = share >= 0.35 ? 1.0 : share / 0.35;
          // El volumen de mapas premia a los equipos que sostuvieron su sinergia en rondas decisivas
          const weightedScore = avgScore * synergy * (1 + 0.002 * (v - 4));
          return { t, v, avgScore, weightedScore, playerCounts };
        })
        .sort((a, b) => b.weightedScore - a.weightedScore);

      const best = sorted[0];
      const mapCounts = Object.values(best.t.players).sort((a: any, b: any) => b - a).join(' - ');
      const playerNames = Object.keys(best.t.players).join(' & ');

      const leaderboard: LeaderboardEntry[] = sorted.map((item, idx) => {
        const counts = Object.values(item.t.players).sort((x: any, y: any) => y - x).join('-');
        return {
          rank: idx + 1,
          name: item.t.name,
          avatar: item.t.logo_url,
          team: `Mapas: ${counts}`,
          formattedValue: `${Math.round(item.avgScore).toLocaleString()}`,
          value: Math.round(item.avgScore).toLocaleString(),
          detail: `${item.v} mapas`,
        };
      });

      return {
        isTeam: true,
        winnerName: best.t.name,
        winnerAvatar: best.t.logo_url,
        value: Math.round(best.avgScore).toLocaleString(),
        label: 'Promedio Score de Equipo',
        highlightTitle: 'Distribución de Mapas',
        highlightValue: mapCounts,
        highlightMap: playerNames,
        leaderboard,
      };
    };

    // 10. PREMIOS POR MOD EQUIPOS - Ponderación de volumen robusta por mod
    const getTeamMod = (mod: string, label: string) => {
      // Exigimos al menos 2 mapas jugados de ese patrón para calificar
      const validModTeams = teams.filter((t) => t[mod] && t[mod].maps >= 2);
      if (validModTeams.length === 0) return null;

      const globalModSum = validModTeams.reduce((sum, t) => sum + t[mod].score / t[mod].maps, 0);
      const globalAvgMod = globalModSum / validModTeams.length;
      const volWeight = mod === 'SV' ? 0.025 : 0.003;
      const m = mod === 'SV' ? 6 : 8;

      const sorted = [...validModTeams]
        .map((t) => {
          const v = t[mod].maps;
          const realAvg = t[mod].score / t[mod].maps;
          const bayesian = (v / (v + m)) * realAvg + (m / (v + m)) * globalAvgMod;
          const weightedMod = bayesian * (1 + volWeight * (v - 1));
          return { t, v, realAvg, weightedMod };
        })
        .sort((a, b) => b.weightedMod - a.weightedMod);

      const best = sorted[0];
      const leaderboard: LeaderboardEntry[] = sorted.map((item, idx) => {
        return {
          rank: idx + 1,
          name: item.t.name,
          avatar: item.t.logo_url,
          team: undefined,
          formattedValue: `${Math.round(item.realAvg).toLocaleString()}`,
          value: Math.round(item.realAvg).toLocaleString(),
          detail: `${item.v} mapas`,
        };
      });

      return {
        isTeam: true,
        winnerName: best.t.name,
        winnerAvatar: best.t.logo_url,
        value: Math.round(best.realAvg).toLocaleString(),
        label: `Avg Score de Equipo en ${label}`,
        leaderboard,
      };
    };

    return {
      ratio: getBestRatio(),
      miss: getBestMiss(),
      wins: getBestWins(),
      acc: getBestAcc(),
      ironman: getIronMan(),
      clutch: getClutch(),
      paliza: getPaliza(),
      rice: getPlayerMod('RC', 'RICE'),
      ln: getPlayerMod('LN', 'LONG NOTE'),
      hybrid: getPlayerMod('HB', 'HYBRID'),
      sv: getPlayerMod('SV', 'SLIDER VELOCITY'),
      teamBalanced: getTeamBalanced(),
      teamRice: getTeamMod('RC', 'RICE'),
      teamLn: getTeamMod('LN', 'LONG NOTE'),
      teamHybrid: getTeamMod('HB', 'HYBRID'),
      teamSv: getTeamMod('SV', 'SLIDER VELOCITY'),
    };
  }, [rawData]);

  if (loading) {
    return <LoadingScreen message="CALCULANDO GANADORES..." />;
  }

  const globalAwards = [
    { id: 'wins', title: 'MAYOR GANADOR', subtitle: '(MVP DEL TORNEO)', color: 'from-purple-400 to-fuchsia-600', data: winners?.wins },
    { id: 'ratio', title: 'MEJOR RATIO PLAYER', subtitle: '(MEJOR PRECISIÓN MA/PA)', color: 'from-yellow-400 to-amber-500', data: winners?.ratio },
    { id: 'miss', title: 'MÁS CONSISTENTE', subtitle: '(MENOR MISS RATE)', color: 'from-zinc-300 to-zinc-500', data: winners?.miss },
    { id: 'acc', title: 'EL METRÓNOMO', subtitle: '(MEJOR ACCURACY GENERAL)', color: 'from-teal-400 to-emerald-500', data: winners?.acc },
  ];

  const epicAwards = [
    { id: 'clutch', title: 'SEÑOR CLUTCH', subtitle: '(MENOR DIFERENCIA EN VICTORIA)', color: 'from-rose-400 to-pink-600', data: winners?.clutch },
    { id: 'paliza', title: 'DON ANTI-CLUTCH', subtitle: '(MAYOR DIFERENCIA EN VICTORIA)', color: 'from-cyan-400 to-blue-600', data: winners?.paliza },
    { id: 'ironman', title: 'EL IRON MAN', subtitle: '(MÁS MAPAS DISPUTADOS)', color: 'from-stone-400 to-stone-600', data: winners?.ironman },
  ];

  const modAwards = [
    { id: 'rice', title: 'MEJOR RICE PLAYER', subtitle: '(PATRÓN SPEED & JACKS)', color: 'from-blue-400 to-blue-600', data: winners?.rice },
    { id: 'ln', title: 'MEJOR LN PLAYER', subtitle: '(PATRÓN LONG NOTES)', color: 'from-red-400 to-red-600', data: winners?.ln },
    { id: 'hybrid', title: 'MEJOR HYBRID PLAYER', subtitle: '(PATRÓN MIXTO)', color: 'from-orange-400 to-orange-600', data: winners?.hybrid },
    { id: 'sv', title: 'MEJOR SV PLAYER', subtitle: '(PATRÓN SLIDER VELOCITY)', color: 'from-emerald-400 to-green-600', data: winners?.sv },
  ];

  const teamGlobalAwards = [
    { id: 'teamBalanced', title: 'MEJOR TEAM EQUILIBRADO', subtitle: '(MEJOR SINERGIA Y SCORE)', color: 'from-amber-400 to-amber-600', data: winners?.teamBalanced },
  ];

  const teamModAwards = [
    { id: 'teamRice', title: 'TEAM MEJOR RICE', subtitle: '(PROMEDIO TEAM EN RICE)', color: 'from-blue-400 to-blue-600', data: winners?.teamRice },
    { id: 'teamLn', title: 'TEAM MEJOR LN', subtitle: '(PROMEDIO TEAM EN LN)', color: 'from-red-400 to-red-600', data: winners?.teamLn },
    { id: 'teamHybrid', title: 'TEAM MEJOR HYBRID', subtitle: '(PROMEDIO TEAM EN HYBRID)', color: 'from-orange-400 to-orange-600', data: winners?.teamHybrid },
    { id: 'teamSv', title: 'TEAM MEJOR SV', subtitle: '(PROMEDIO TEAM EN SV)', color: 'from-emerald-400 to-green-600', data: winners?.teamSv },
  ];

  const renderCard = (award: any) => {
    const winnerData = award.data;
    const isTeam = winnerData?.isTeam;
    const winnerPlayer = winnerData?.winner;
    const isFlipped = !!flipped[award.id];
    const leaderboard: LeaderboardEntry[] = winnerData?.leaderboard || [];

    return (
      <div
        key={award.id}
        className="group relative w-full h-[520px] perspective-1000 select-none"
        title={isFlipped ? undefined : 'Haz clic para ver el ranking completo de la categoría'}
      >
        <div
          className={`w-full h-full duration-700 preserve-3d relative transition-transform ${
            isFlipped ? 'rotate-y-180' : 'hover:scale-[1.02]'
          }`}
        >
          {/* ================= CARA FRONTAL: GANADOR (1º PUESTO) ================= */}
          <div
            onClick={() => !isFlipped && toggleFlip(award.id)}
            className={`absolute inset-0 backface-hidden w-full h-full bg-[#1a1a1a] border border-white/10 group-hover:border-[#fdc15a]/40 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.4)] group-hover:shadow-[0_0_30px_rgba(253,193,90,0.15)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
              isFlipped ? 'pointer-events-none invisible opacity-0' : 'pointer-events-auto opacity-100'
            }`}
          >
            {/* Glow superior con gradiente del premio */}
            <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-b ${award.color} opacity-15 pointer-events-none z-0`}></div>

            {/* Encabezado del premio con botón de volteo */}
            <div className="relative z-10 pt-5 px-5 text-center">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-[#fdc15a] uppercase font-bold tracking-widest">
                  GANADOR
                </span>
                <span className="text-[10px] font-mono text-zinc-400 hover:text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                  <span>Ver Todos ({leaderboard.length})</span>
                  <span>↺</span>
                </span>
              </div>
              <h3 className="font-['ITCMachine'] text-xl sm:text-2xl text-white uppercase tracking-wider group-hover:text-[#fdc15a] transition-colors leading-tight">
                {award.title}
              </h3>
              {award.subtitle && (
                <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">
                  {award.subtitle}
                </p>
              )}
            </div>

            {/* Cuerpo del ganador */}
            {winnerData?.winner || isTeam ? (
              <div className="relative z-10 flex flex-col items-center px-5 py-2">
                {/* Avatar / Logo */}
                <div
                  className={`relative my-2 ${!isTeam ? 'cursor-pointer' : ''}`}
                  onClick={
                    !isTeam
                      ? (e) => {
                          e.stopPropagation();
                          if (winnerPlayer?.id || winnerPlayer?.nickname) {
                            setSelectedPlayerForStats(winnerPlayer.id || winnerPlayer.nickname);
                          }
                        }
                      : undefined
                  }
                  title={!isTeam ? `Ver expediente de ${winnerPlayer?.nickname}` : undefined}
                >
                  <img
                    src={isTeam ? (winnerData.winnerAvatar || '/no-logo.png') : (winnerPlayer?.avatar_url || '/no-logo.png')}
                    alt={isTeam ? winnerData.winnerName : winnerPlayer?.nickname}
                    className="w-22 h-22 sm:w-24 sm:h-24 rounded-full border-4 border-[#2e2e2e] shadow-[0_0_25px_rgba(0,0,0,0.7)] object-cover bg-zinc-800 transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-[#fdc15a] text-black text-xs font-black px-1.5 py-0.5 rounded-full shadow-md font-mono">
                    1º
                  </span>
                </div>

                {/* Nombre del ganador */}
                {isTeam ? (
                  <h4 className="font-['ITCMachine'] text-2xl sm:text-3xl text-white uppercase tracking-tight text-center mt-1 px-2">
                    {winnerData.winnerName}
                  </h4>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (winnerPlayer?.id || winnerPlayer?.nickname) {
                        setSelectedPlayerForStats(winnerPlayer.id || winnerPlayer.nickname);
                      }
                    }}
                    className="group/wname font-['ITCMachine'] text-2xl sm:text-3xl text-white hover:text-[#fdc15a] uppercase tracking-tight text-center mt-1 px-2 transition-colors cursor-pointer"
                    title={`Ver expediente y scores de ${winnerPlayer?.nickname}`}
                  >
                    <span>{winnerPlayer?.nickname}</span>
                    <span className="text-xs text-zinc-500 group-hover/wname:text-[#fdc15a] ml-1.5 font-sans font-normal opacity-0 group-hover/wname:opacity-100 transition-opacity">
                      ↗
                    </span>
                  </button>
                )}

                {/* Subtítulo / Equipo */}
                {!isTeam && (
                  <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-3 py-0.5 rounded-full text-zinc-300 uppercase tracking-widest mt-1.5">
                    {winnerPlayer?.team?.name || 'Agente Libre'}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest py-16 text-center">
                Sin datos suficientes
              </div>
            )}

            {/* Footer con estadísticas */}
            {winnerData && (
              <div className="relative z-10 bg-black/60 border-t border-white/10 w-full mt-auto text-center flex flex-col justify-end">
                <div className="py-2.5 px-4">
                  <p className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-widest mb-0.5">
                    {winnerData.label}
                  </p>
                  <p className={`font-['ITCMachine'] text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r ${award.color}`}>
                    {winnerData.value}
                  </p>
                </div>

                {/* Highlights especiales: Mapas con banner */}
                {winnerData.highlightValue !== undefined && (
                  <div className="relative border-t border-white/10 min-h-[58px] flex flex-col items-center justify-center overflow-hidden group/map">
                    {winnerData.highlightBanner && (
                      <img
                        src={`https://assets.ppy.sh/beatmaps/${winnerData.highlightBanner}/covers/cover.jpg`}
                        className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover/map:opacity-35 transition-opacity z-0"
                        alt="map bg"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent z-0"></div>

                    <div className="relative z-10 py-1.5 px-3 flex flex-col items-center w-full">
                      <p className="text-[8px] font-mono text-zinc-400 uppercase font-bold tracking-widest">
                        {winnerData.highlightTitle}
                      </p>
                      <p className="font-['ITCMachine'] text-base sm:text-lg text-white drop-shadow-md">
                        {typeof winnerData.highlightValue === 'number'
                          ? winnerData.highlightValue.toLocaleString()
                          : winnerData.highlightValue}
                      </p>
                      <p className="text-[9px] font-mono text-[#fdc15a] uppercase tracking-wider truncate w-[90%] text-center">
                        {winnerData.highlightMap}
                      </p>
                    </div>
                  </div>
                )}

                {/* Highlights de Misses */}
                {winnerData.totalMisses !== undefined && (
                  <div className="border-t border-white/10 py-2 px-3 flex flex-col items-center bg-black/40">
                    <p className="text-[8px] font-mono text-zinc-400 uppercase font-bold tracking-widest">
                      Misses Totales: <strong className="text-red-400 font-['ITCMachine'] text-base ml-1">{winnerData.totalMisses}</strong>
                    </p>
                    {winnerData.stageMisses && (
                      <div className="flex flex-wrap justify-center gap-1 mt-1">
                        {Object.entries(winnerData.stageMisses).map(([stage, misses]) => (
                          <div
                            key={stage}
                            className="bg-white/5 border border-white/10 rounded px-1 py-0.2 flex items-center gap-1 text-[7px] font-mono uppercase"
                          >
                            <span className="text-zinc-400">{formatStage(stage)}</span>
                            <span className="text-red-400 font-bold">{misses as number}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Highlight de Win Rate */}
                {winnerData.winRate !== undefined && (
                  <div className="border-t border-white/10 py-1.5 flex flex-col items-center bg-black/40">
                    <p className="text-[8px] font-mono text-zinc-400 uppercase font-bold tracking-widest">
                      Tasa de Victoria: <strong className="text-purple-400 font-['ITCMachine'] text-base ml-1">{winnerData.winRate}%</strong>
                    </p>
                  </div>
                )}

                {/* Enlace directo a estadísticas o modal para ganador */}
                {!isTeam ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (winnerPlayer?.id || winnerPlayer?.nickname) {
                        setSelectedPlayerForStats(winnerPlayer.id || winnerPlayer.nickname);
                      }
                    }}
                    className="py-2 bg-white/5 hover:bg-[#fdc15a] hover:text-black text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-300 transition-colors flex items-center justify-center gap-1.5 border-t border-white/10 w-full cursor-pointer"
                  >
                    <span>VER EXPEDIENTE / SCORES</span>
                    <span className="text-sm leading-none">↗</span>
                  </button>
                ) : (
                  <Link
                    href={`/estadisticas?player=${encodeURIComponent(winnerData.winnerName)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="py-2 bg-white/5 hover:bg-[#fdc15a] hover:text-black text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-300 transition-colors flex items-center justify-center gap-1.5 border-t border-white/10"
                  >
                    <span>VER EN ESTADÍSTICAS</span>
                    <span className="text-sm leading-none">→</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ================= CARA DORSAL: TABLA DE POSICIONES COMPLETA ================= */}
          <div
            className={`absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-[#161616] border-2 border-[#fdc15a]/50 rounded-xl shadow-[0_0_30px_rgba(253,193,90,0.25)] flex flex-col justify-between overflow-hidden p-3.5 sm:p-4 transition-opacity duration-300 ${
              isFlipped ? 'pointer-events-auto opacity-100 z-10' : 'pointer-events-none invisible opacity-0 z-0'
            }`}
          >
            {/* Header del Dorso */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="min-w-0 pr-2">
                <span className="text-[9px] font-mono text-[#fdc15a] uppercase font-bold tracking-widest block">
                  POSICIONES • {leaderboard.length} PARTICIPANTES
                </span>
                <h4 className="font-['ITCMachine'] text-base sm:text-lg text-white uppercase tracking-wider truncate">
                  {award.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFlip(award.id);
                }}
                className="text-[10px] font-mono text-zinc-300 bg-white/10 border border-white/15 px-2.5 py-1 rounded flex items-center gap-1.5 flex-shrink-0 hover:bg-[#fdc15a] hover:text-black hover:border-[#fdc15a] transition-all cursor-pointer"
                title="Volver al frente"
              >
                <span>↺</span>
                <span>Frente</span>
              </button>
            </div>

            {/* Lista completa con scrollbar custom */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 my-2 max-h-[385px]"
            >
              {leaderboard.length > 0 ? (
                leaderboard.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isSecond = idx === 1;
                  const isThird = idx === 2;

                  let rankIcon = `${idx + 1}º`;
                  let rankStyle = 'bg-white/5 border-white/10 text-zinc-400';

                  if (isFirst) {
                    rankIcon = '1º';
                    rankStyle = 'bg-[#fdc15a]/20 border-[#fdc15a]/50 text-[#fdc15a] font-black';
                  } else if (isSecond) {
                    rankIcon = '2º';
                    rankStyle = 'bg-slate-300/20 border-slate-300/50 text-slate-200 font-black';
                  } else if (isThird) {
                    rankIcon = '3º';
                    rankStyle = 'bg-amber-700/20 border-amber-700/50 text-amber-300 font-black';
                  }

                  return isTeam ? (
                    <Link
                      key={idx}
                      href={`/estadisticas?player=${encodeURIComponent(item.name)}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`group/row flex items-center justify-between gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                        isFirst
                          ? 'bg-[#fdc15a]/10 border-[#fdc15a]/40 hover:bg-[#fdc15a]/20 shadow-[0_0_15px_rgba(253,193,90,0.1)]'
                          : 'bg-black/40 border-white/5 hover:bg-white/10 hover:border-[#fdc15a]/40'
                      }`}
                      title={`Ver estadísticas de ${item.name}`}
                    >
                      {/* Lado izquierdo: Posición, Avatar, Nombre y Equipo */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border flex-shrink-0 font-bold ${rankStyle}`}
                        >
                          {rankIcon}
                        </span>
                        <img
                          src={item.avatar || '/no-logo.png'}
                          alt={item.name}
                          className="w-7 h-7 rounded-full object-cover border border-white/10 bg-zinc-800 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-['TrebuchetMS'] text-xs sm:text-sm font-bold truncate leading-tight group-hover/row:text-[#fdc15a] transition-colors ${
                              isFirst ? 'text-[#fdc15a]' : 'text-white'
                            }`}
                          >
                            {item.name}
                          </p>
                          {item.team && (
                            <p className="font-mono text-[9px] text-zinc-400 truncate leading-tight mt-0.5">
                              {item.team}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lado derecho: Valor principal y detalle */}
                      <div className="text-right pl-1 flex-shrink-0 flex items-center gap-1.5">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-['ITCMachine'] text-sm sm:text-base leading-tight tracking-tight ${
                              isFirst ? 'text-[#fdc15a]' : 'text-zinc-200'
                            }`}
                          >
                            {item.value || item.formattedValue}
                          </span>
                          {item.detail && (
                            <span className="font-mono text-[8px] sm:text-[9px] text-zinc-400 leading-tight">
                              {item.detail}
                            </span>
                          )}
                        </div>
                        <span className="text-zinc-500 group-hover/row:text-[#fdc15a] group-hover/row:translate-x-0.5 transition-all text-xs">
                          →
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlayerForStats(item.playerId || item.name);
                      }}
                      className={`group/row flex items-center justify-between gap-2 p-2 rounded-lg border transition-all cursor-pointer w-full text-left ${
                        isFirst
                          ? 'bg-[#fdc15a]/10 border-[#fdc15a]/40 hover:bg-[#fdc15a]/20 shadow-[0_0_15px_rgba(253,193,90,0.1)]'
                          : 'bg-black/40 border-white/5 hover:bg-white/10 hover:border-[#fdc15a]/40'
                      }`}
                      title={`Ver expediente y scores de ${item.name}`}
                    >
                      {/* Lado izquierdo: Posición, Avatar, Nombre y Equipo */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border flex-shrink-0 font-bold ${rankStyle}`}
                        >
                          {rankIcon}
                        </span>
                        <img
                          src={item.avatar || '/no-logo.png'}
                          alt={item.name}
                          className="w-7 h-7 rounded-full object-cover border border-white/10 bg-zinc-800 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-['TrebuchetMS'] text-xs sm:text-sm font-bold truncate leading-tight group-hover/row:text-[#fdc15a] transition-colors ${
                              isFirst ? 'text-[#fdc15a]' : 'text-white'
                            }`}
                          >
                            {item.name}
                          </p>
                          {item.team && (
                            <p className="font-mono text-[9px] text-zinc-400 truncate leading-tight mt-0.5">
                              {item.team}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lado derecho: Valor principal y detalle */}
                      <div className="text-right pl-1 flex-shrink-0 flex items-center gap-1.5">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-['ITCMachine'] text-sm sm:text-base leading-tight tracking-tight ${
                              isFirst ? 'text-[#fdc15a]' : 'text-zinc-200'
                            }`}
                          >
                            {item.value || item.formattedValue}
                          </span>
                          {item.detail && (
                            <span className="font-mono text-[8px] sm:text-[9px] text-zinc-400 leading-tight">
                              {item.detail}
                            </span>
                          )}
                        </div>
                        <span className="text-zinc-500 group-hover/row:text-[#fdc15a] group-hover/row:translate-x-0.5 transition-all text-xs">
                          ↗
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-zinc-500 font-mono text-xs text-center py-6">
                  No hay suficientes datos registrados
                </div>
              )}
            </div>

            {/* Footer del Dorso */}
            <div
              onClick={() => toggleFlip(award.id)}
              className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-400 cursor-pointer hover:text-zinc-200"
            >
              <span className="truncate pr-2">Click en un participante para ver su score</span>
              <span className="text-[#fdc15a] flex-shrink-0">Toca para voltear ↺</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans pb-24 overflow-x-hidden animate-fadeIn">
      {/* HEADER DE LA PÁGINA */}
      <div className="relative pt-8 sm:pt-14 pb-8 sm:pb-10 text-center px-4">
        <h1 className="font-['ITCMachine'] text-4xl sm:text-6xl md:text-7xl lg:text-[80px] uppercase tracking-tight text-white leading-none">
          TOURNAMENT <span className="text-[#fdc15a]">AWARDS</span>
        </h1>

        <p className="text-zinc-300 font-['TrebuchetMS'] text-xs sm:text-base max-w-xl mx-auto mt-3">
          Reconocimiento al rendimiento individual y colectivo desde Round of 16 hasta Grand Finals.
        </p>

        <p className="text-[#fdc15a] font-mono text-[11px] sm:text-xs uppercase tracking-widest mt-2">
          Haz clic en cualquier tarjeta para ver el ranking completo y acceder a las estadísticas de cada uno
        </p>

        {/* TABS DE FILTRADO POR CATEGORÍA */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 mt-6 sm:mt-8 max-w-4xl mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-['TrebuchetMS'] tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#fdc15a] text-black font-bold shadow-[0_0_20px_rgba(253,193,90,0.3)] scale-105'
                  : 'bg-[#1a1a1a] text-zinc-300 border border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO DE AWARDS */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
        {/* SECCIÓN 1: PREMIOS INDIVIDUALES */}
        {(activeCategory === 'ALL' || activeCategory === 'INDIVIDUALES') && (
          <div>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-[#fdc15a]/50"></div>
              <h2 className="font-['ITCMachine'] text-2xl sm:text-3xl text-[#fdc15a] uppercase tracking-widest text-center">
                Premios Individuales
              </h2>
              <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-[#fdc15a]/50"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {globalAwards.map(renderCard)}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: MOMENTOS INCHEQUEABLES */}
        {(activeCategory === 'ALL' || activeCategory === 'EPICOS') && (
          <div>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-[#fdc15a]/40"></div>
              <h2 className="font-['ITCMachine'] text-2xl sm:text-3xl text-white uppercase tracking-widest text-center">
                Momentos Inchequeables
              </h2>
              <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-[#fdc15a]/40"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-[1100px] mx-auto gap-6 sm:gap-8">
              {epicAwards.map(renderCard)}
            </div>
          </div>
        )}

        {/* SECCIÓN 3: REY DE LOS PATRONES */}
        {(activeCategory === 'ALL' || activeCategory === 'PATRONES') && (
          <div>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-[#fdc15a]/40"></div>
              <h2 className="font-['ITCMachine'] text-2xl sm:text-3xl text-white uppercase tracking-widest text-center">
                Rey de los Patrones
              </h2>
              <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-[#fdc15a]/40"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {modAwards.map(renderCard)}
            </div>
          </div>
        )}

        {/* SECCIÓN 4: PREMIOS POR EQUIPOS */}
        {(activeCategory === 'ALL' || activeCategory === 'EQUIPOS') && (
          <div>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-[#fdc15a]/50"></div>
              <h2 className="font-['ITCMachine'] text-2xl sm:text-3xl text-[#fdc15a] uppercase tracking-widest text-center">
                Premios Por Equipos
              </h2>
              <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-[#fdc15a]/50"></div>
            </div>

            {/* Team Equilibrado */}
            <div className="max-w-[420px] mx-auto mb-8">
              {teamGlobalAwards.map(renderCard)}
            </div>

            {/* Teams por Mod */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {teamModAwards.map(renderCard)}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE HISTORIAL DE SCORES Y EXPEDIENTE */}
      <PlayerScoresModal
        playerId={selectedPlayerForStats}
        onClose={() => setSelectedPlayerForStats(null)}
        onSelectPlayer={(id) => setSelectedPlayerForStats(id)}
      />
    </main>
  );
}