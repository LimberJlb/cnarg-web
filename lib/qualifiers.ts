import { BeatmapData } from '@/types/stats';
import {
  QualifierRawScore,
  QualifierPlayerResult,
  PlayerMapQualifierData,
  QualifierAttempt,
} from '@/types/qualifiers';

export const UNPLAYED_MAP_PENALTY_RANK = 114;

/**
 * Procesa los puntajes crudos de qualifiers y calcula el AVR RANK y rankings por mapa.
 */
export function calculateQualifierLeaderboard(
  rawScores: QualifierRawScore[],
  qualifierMaps: BeatmapData[]
): QualifierPlayerResult[] {
  if (!rawScores.length || !qualifierMaps.length) return [];

  // 1. Identificar mapas válidos de qualifiers ordenados por slot
  const sortedMaps = [...qualifierMaps].sort((a, b) => a.slot - b.slot);
  const mapIds = sortedMaps.map((m) => m.id);

  // 2. Agrupar por jugador y por mapa
  const playersMap: Record<
    string,
    {
      player_id: string;
      nickname: string;
      avatar_url: string | null;
      osu_id: number;
      team_name?: string;
      team_logo?: string | null;
    }
  > = {};

  // pId -> mapId -> QualifierAttempt[]
  const attemptsByPlayerAndMap: Record<string, Record<string, QualifierAttempt[]>> = {};

  for (const score of rawScores) {
    if (!mapIds.includes(score.map_id) || !score.player) continue;

    const p = score.player;
    if (!playersMap[p.id]) {
      playersMap[p.id] = {
        player_id: p.id,
        nickname: p.nickname,
        avatar_url: p.avatar_url,
        osu_id: p.osu_id,
        team_name: p.team?.name,
        team_logo: p.team?.logo_url,
      };
    }

    if (!attemptsByPlayerAndMap[p.id]) {
      attemptsByPlayerAndMap[p.id] = {};
    }
    if (!attemptsByPlayerAndMap[p.id][score.map_id]) {
      attemptsByPlayerAndMap[p.id][score.map_id] = [];
    }

    attemptsByPlayerAndMap[p.id][score.map_id].push({
      score: score.score,
      accuracy: score.accuracy,
      created_at: score.created_at,
    });
  }

  // Ordenar los intentos de cada jugador por fecha (Run 1, Run 2)
  for (const pId of Object.keys(attemptsByPlayerAndMap)) {
    for (const mId of Object.keys(attemptsByPlayerAndMap[pId])) {
      attemptsByPlayerAndMap[pId][mId].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  }

  // 3. Para cada mapa, determinar el mejor score de cada jugador y rankearlos
  // mapId -> { pId, bestScore, bestAcc, attempts }[]
  const mapRankings: Record<
    string,
    {
      pId: string;
      bestScore: number;
      bestAcc: number;
      attempts: QualifierAttempt[];
    }[]
  > = {};

  for (const mId of mapIds) {
    const list: {
      pId: string;
      bestScore: number;
      bestAcc: number;
      attempts: QualifierAttempt[];
    }[] = [];

    for (const pId of Object.keys(playersMap)) {
      const attempts = attemptsByPlayerAndMap[pId]?.[mId] || [];
      if (attempts.length > 0) {
        let bestScore = 0;
        let bestAcc = 0;
        for (const att of attempts) {
          if (att.score >= bestScore) {
            bestScore = att.score;
            bestAcc = att.accuracy;
          }
        }
        list.push({ pId, bestScore, bestAcc, attempts });
      }
    }

    // Ordenar de mayor a menor score
    list.sort((a, b) => b.bestScore - a.bestScore);
    mapRankings[mId] = list;
  }

  // 4. Mapear los puestos por mapa: pId -> mapId -> PlayerMapQualifierData
  const playerMapData: Record<string, Record<string, PlayerMapQualifierData>> = {};
  for (const pId of Object.keys(playersMap)) {
    playerMapData[pId] = {};
  }

  for (const mId of mapIds) {
    const list = mapRankings[mId];
    list.forEach((item, index) => {
      playerMapData[item.pId][mId] = {
        map_id: mId,
        bestScore: item.bestScore,
        bestAccuracy: item.bestAcc,
        rank: index + 1,
        attempts: item.attempts,
      };
    });
  }

  // 5. Consolidar el resultado de cada jugador (AVR Rank y Avg Score)
  const totalMaps = mapIds.length || 1;
  const results: QualifierPlayerResult[] = Object.values(playersMap).map((p) => {
    let sumRank = 0;
    let totalScore = 0;
    let playedMapsCount = 0;

    for (const mId of mapIds) {
      const mapData = playerMapData[p.player_id]?.[mId];
      if (mapData) {
        sumRank += mapData.rank;
        totalScore += mapData.bestScore;
        playedMapsCount++;
      } else {
        sumRank += UNPLAYED_MAP_PENALTY_RANK;
      }
    }

    const avgRank = sumRank / totalMaps;
    const avgScore = totalScore / totalMaps;

    return {
      seed: 0, // Se asignará luego del sort
      player_id: p.player_id,
      nickname: p.nickname,
      avatar_url: p.avatar_url,
      osu_id: p.osu_id,
      team_name: p.team_name,
      team_logo: p.team_logo,
      avgRank,
      avgScore,
      totalScore,
      sumRank,
      playedMapsCount,
      maps: playerMapData[p.player_id],
    };
  });

  // 6. Ordenar por AVR Rank ascendente (menor es mejor) y Avg Score descendente (desempate)
  results.sort((a, b) => {
    if (a.avgRank !== b.avgRank) return a.avgRank - b.avgRank;
    return b.avgScore - a.avgScore;
  });

  // 7. Asignar seeds definitivos
  results.forEach((r, idx) => {
    r.seed = idx + 1;
  });

  return results;
}
