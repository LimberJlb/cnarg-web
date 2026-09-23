import { supabase } from './supabase';
import { TournamentPlacement, calculateTournamentPlacements } from './tournamentPlacements';
import { calculateQualifierLeaderboard } from './qualifiers';
import { BeatmapData, Stage } from '@/types/stats';
import { QualifierRawScore } from '@/types/qualifiers';

export interface PlayerBasicInfo {
  id: string;
  nickname: string;
  avatar_url: string | null;
  osu_id: number;
  seed?: number;
  country_rank?: number | string;
  team?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export interface PlayerQualifierStat {
  map_id: string;
  beatmap_id?: number;
  slot: number;
  pattern_type: string;
  title: string;
  artist: string;
  difficulty_name: string;
  best_score: number;
  best_accuracy: number;
  rank_in_map: number;
  total_players: number;
  attempts_count: number;
}

export interface PlayerBracketMapScore {
  id: string;
  match_id: string;
  beatmap_id?: number;
  stage: string;
  match_order: number;
  bracket_group: string;
  map_slot: number;
  map_pattern: string;
  map_title: string;
  map_artist: string;
  map_diff: string;
  rival_nickname: string;
  rival_avatar_url: string | null;
  rival_osu_id?: number;
  player_score: number;
  rival_score: number;
  player_acc: number;
  rival_acc: number;
  won: boolean;
  score_diff: number;
  marvelous: number;
  perfect: number;
  great: number;
  good: number;
  bad: number;
  miss: number;
  combo: number;
  ratio: number;
  rival_marvelous: number;
  rival_perfect: number;
  rival_great: number;
  rival_good: number;
  rival_bad: number;
  rival_miss: number;
  rival_combo: number;
  rival_ratio: number;
  mp_link: string | null;
}

export interface PlayerBracketMatchGroup {
  match_id: string;
  stage: string;
  match_order: number;
  bracket_group: string;
  team_name: string;
  team_logo: string | null;
  team_score: number;
  opponent_team_name: string;
  opponent_team_logo: string | null;
  opponent_team_score: number;
  series_won: boolean;
  mp_link: string | null;
  maps: PlayerBracketMapScore[];
}

export interface PlayerGlobalMetrics {
  totalMapsPlayed: number;
  qualifierMapsPlayed: number;
  bracketMapsPlayed: number;
  bracketMapsWon: number;
  bracketMapsLost: number;
  bracketWinrate: number;
  overallAvgScore: number;
  overallAvgAcc: number;
  peakScore: number;
  peakScoreMap: string;
  peakScoreStage: string;
}

export interface PlayerFullTournamentStats {
  player: PlayerBasicInfo;
  placement: TournamentPlacement | null;
  qualifiersSummary: {
    avgRank: number;
    avgScore: number;
    totalScore: number;
    seed: number;
  } | null;
  qualifierScores: PlayerQualifierStat[];
  bracketMatches: PlayerBracketMatchGroup[];
  allBracketMapScores: PlayerBracketMapScore[];
  metrics: PlayerGlobalMetrics;
}

// Caché en memoria para evitar peticiones redundantes
const playerStatsCache = new Map<string, PlayerFullTournamentStats>();
let allPlayersCache: PlayerBasicInfo[] | null = null;
let allMatchesCache: any[] | null = null;
let allQualifierMapsCache: BeatmapData[] | null = null;
let allQualifierScoresCache: QualifierRawScore[] | null = null;

/**
 * Obtiene la lista completa de jugadores del torneo para el selector del modal
 */
export async function fetchAllTournamentPlayers(): Promise<PlayerBasicInfo[]> {
  if (allPlayersCache) return allPlayersCache;

  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, nickname, avatar_url, osu_id, seed, country_rank, teams(id, name, logo_url)')
      .order('seed', { ascending: true });

    if (error || !data) return [];

    const mapped: PlayerBasicInfo[] = data.map((p: any) => ({
      id: p.id,
      nickname: p.nickname,
      avatar_url: p.avatar_url,
      osu_id: p.osu_id,
      seed: p.seed,
      country_rank: p.country_rank,
      team: p.teams ? { id: p.teams.id, name: p.teams.name, logo_url: p.teams.logo_url } : null,
    }));

    allPlayersCache = mapped;
    return mapped;
  } catch (err) {
    console.error('Error fetching all tournament players:', err);
    return [];
  }
}

/**
 * Obtiene todo el expediente de scores y estadísticas de un jugador a lo largo del torneo
 */
export async function fetchPlayerTournamentStats(
  playerId: string
): Promise<PlayerFullTournamentStats | null> {
  if (playerStatsCache.has(playerId)) {
    return playerStatsCache.get(playerId)!;
  }

  try {
    // 1. Obtener lista de jugadores y resolver el UUID real del jugador
    const playersList = allPlayersCache ? allPlayersCache : await fetchAllTournamentPlayers();
    if (!allPlayersCache && playersList.length > 0) allPlayersCache = playersList;

    const player = playersList.find(
      (p) =>
        p.id === playerId ||
        p.nickname.toLowerCase() === playerId.toLowerCase() ||
        String(p.osu_id) === String(playerId)
    );
    if (!player) return null;

    const actualPlayerId = player.id;
    if (playerStatsCache.has(actualPlayerId)) {
      return playerStatsCache.get(actualPlayerId)!;
    }

    // 2. Datos de partidas y referencias compartidas
    const [matchesRes, qMapsRes, qScoresRes, playerMatchResultsRes, lobbiesRes] =
      await Promise.all([
        allMatchesCache
          ? Promise.resolve({ data: allMatchesCache, error: null })
          : supabase
              .from('matches')
              .select('id, stage, match_order, bracket_group, team_1_id, team_2_id, team_1_score, team_2_score, team_1:team_1_id(id, name, logo_url), team_2:team_2_id(id, name, logo_url)'),
        allQualifierMapsCache
          ? Promise.resolve({ data: allQualifierMapsCache, error: null })
          : supabase
              .from('mappool_maps')
              .select('*, stages!inner(name)')
              .ilike('stages.name', '%QUALIFIER%'),
        allQualifierScoresCache
          ? Promise.resolve({ data: allQualifierScoresCache, error: null })
          : supabase
              .from('qualifier_scores')
              .select('*, player:player_id(id, nickname, avatar_url, osu_id, teams(name, logo_url))'),
        supabase
          .from('match_map_results')
          .select(`
            *,
            mappool_maps(id, beatmap_id, slot, pattern_type, title, artist, difficulty_name),
            matches(id, stage, match_order, bracket_group, team_1_id, team_2_id, team_1_score, team_2_score, team_1:team_1_id(id, name, logo_url), team_2:team_2_id(id, name, logo_url)),
            player_1:player_1_id(id, nickname, avatar_url, osu_id),
            player_2:player_2_id(id, nickname, avatar_url, osu_id)
          `)
          .or(`player_1_id.eq.${actualPlayerId},player_2_id.eq.${actualPlayerId}`),
        supabase.from('lobbies').select('match_id, lobby_link, osu_match_id'),
      ]);

    if (matchesRes.data && !allMatchesCache) allMatchesCache = matchesRes.data;
    if (qMapsRes.data && !allQualifierMapsCache) {
      allQualifierMapsCache = ((qMapsRes.data as BeatmapData[]) || [])
        .filter((m) => m.stages?.name?.toUpperCase().includes('QUALIFIER'));
    }
    if (qScoresRes.data && !allQualifierScoresCache) allQualifierScoresCache = qScoresRes.data as QualifierRawScore[];

    // Placements del torneo
    const placements = calculateTournamentPlacements(allMatchesCache || []);
    const playerPlacement = player.team?.id ? placements[player.team.id] || null : null;

    // Mapa de MP Links por match_id
    const lobbyMap: Record<string, string> = {};
    if (lobbiesRes.data) {
      lobbiesRes.data.forEach((l: any) => {
        lobbyMap[l.match_id] =
          l.lobby_link || (l.osu_match_id ? `https://osu.ppy.sh/community/matches/${l.osu_match_id}` : null);
      });
    }

    // 2. Procesar Qualifiers (filtrando estrictamente a los 8 mapas de Qualifiers)
    const qMaps = ((allQualifierMapsCache || []) as BeatmapData[])
      .filter((m) => m.stages?.name?.toUpperCase().includes('QUALIFIER'))
      .sort((a, b) => a.slot - b.slot);
    const qLeaderboard = calculateQualifierLeaderboard(allQualifierScoresCache || [], qMaps);
    const playerQResult = qLeaderboard.find((p) => p.player_id === actualPlayerId);

    const qualifierScores: PlayerQualifierStat[] = qMaps.map((map) => {
      const pMapData = playerQResult?.maps[map.id];
      const attemptsCount = pMapData?.attempts?.length || (pMapData ? 1 : 0);

      // Calcular cantidad total de jugadores que jugaron este mapa
      let totalPlayersInMap = 0;
      qLeaderboard.forEach((p) => {
        if (p.maps[map.id]) totalPlayersInMap++;
      });

      return {
        map_id: map.id,
        beatmap_id: map.beatmap_id,
        slot: map.slot,
        pattern_type: map.pattern_type,
        title: map.title,
        artist: map.artist,
        difficulty_name: map.difficulty_name,
        best_score: pMapData?.bestScore || 0,
        best_accuracy: pMapData ? (pMapData.bestAccuracy <= 1 ? pMapData.bestAccuracy * 100 : pMapData.bestAccuracy) : 0,
        rank_in_map: pMapData?.rank || 0,
        total_players: totalPlayersInMap,
        attempts_count: attemptsCount,
      };
    });

    const qualifiersSummary = playerQResult
      ? {
          avgRank: Number(playerQResult.avgRank.toFixed(2)),
          avgScore: Math.round(playerQResult.avgScore),
          totalScore: Math.round(playerQResult.totalScore),
          seed: playerQResult.seed,
        }
      : null;

    // 3. Procesar Brackets (Partidas de Llaves)
    const rawMatchResults = playerMatchResultsRes.data || [];
    const allBracketMapScores: PlayerBracketMapScore[] = [];
    const matchGroupsMap: Record<string, PlayerBracketMatchGroup> = {};

    rawMatchResults.forEach((row: any) => {
      const isPlayer1 = row.player_1_id === actualPlayerId;
      const playerScore = isPlayer1 ? (row.score_1 || 0) : (row.score_2 || 0);
      const rivalScore = isPlayer1 ? (row.score_2 || 0) : (row.score_1 || 0);

      const rawPlayerAcc = isPlayer1 ? (row.p1_accuracy || 0) : (row.p2_accuracy || 0);
      const playerAcc = rawPlayerAcc <= 1 ? rawPlayerAcc * 100 : rawPlayerAcc;

      const rawRivalAcc = isPlayer1 ? (row.p2_accuracy || 0) : (row.p1_accuracy || 0);
      const rivalAcc = rawRivalAcc <= 1 ? rawRivalAcc * 100 : rawRivalAcc;

      const marv = isPlayer1 ? (row.p1_marvelous || 0) : (row.p2_marvelous || 0);
      const perf = isPlayer1 ? (row.p1_perfects || 0) : (row.p2_perfects || 0);
      const great = isPlayer1 ? (row.p1_greats || 0) : (row.p2_greats || 0);
      const good = isPlayer1 ? (row.p1_goods || 0) : (row.p2_goods || 0);
      const bad = isPlayer1 ? (row.p1_bads || 0) : (row.p2_bads || 0);
      const miss = isPlayer1 ? (row.p1_misses || 0) : (row.p2_misses || 0);
      const combo = isPlayer1 ? (row.p1_combo || 0) : (row.p2_combo || 0);
      const ratio = perf > 0 ? Number((marv / perf).toFixed(2)) : marv;

      const rivalMarv = isPlayer1 ? (row.p2_marvelous || 0) : (row.p1_marvelous || 0);
      const rivalPerf = isPlayer1 ? (row.p2_perfects || 0) : (row.p1_perfects || 0);
      const rivalGreat = isPlayer1 ? (row.p2_greats || 0) : (row.p1_greats || 0);
      const rivalGood = isPlayer1 ? (row.p2_goods || 0) : (row.p1_goods || 0);
      const rivalBad = isPlayer1 ? (row.p2_bads || 0) : (row.p1_bads || 0);
      const rivalMiss = isPlayer1 ? (row.p2_misses || 0) : (row.p1_misses || 0);
      const rivalCombo = isPlayer1 ? (row.p2_combo || 0) : (row.p1_combo || 0);
      const rivalRatio = rivalPerf > 0 ? Number((rivalMarv / rivalPerf).toFixed(2)) : rivalMarv;

      const rival = isPlayer1 ? row.player_2 : row.player_1;
      const mpLink = lobbyMap[row.match_id] || null;

      const mapScore: PlayerBracketMapScore = {
        id: row.id,
        match_id: row.match_id,
        beatmap_id: row.mappool_maps?.beatmap_id,
        stage: row.matches?.stage || 'BRACKETS',
        match_order: row.matches?.match_order || 0,
        bracket_group: row.matches?.bracket_group || 'winners',
        map_slot: row.mappool_maps?.slot || 1,
        map_pattern: row.mappool_maps?.pattern_type || 'RC',
        map_title: row.mappool_maps?.title || 'Beatmap',
        map_artist: row.mappool_maps?.artist || 'Artista',
        map_diff: row.mappool_maps?.difficulty_name || '',
        rival_nickname: rival?.nickname || 'Rival',
        rival_avatar_url: rival?.avatar_url || (rival?.osu_id ? `https://a.ppy.sh/${rival.osu_id}` : null),
        rival_osu_id: rival?.osu_id,
        player_score: playerScore,
        rival_score: rivalScore,
        player_acc: Number(playerAcc.toFixed(2)),
        rival_acc: Number(rivalAcc.toFixed(2)),
        won: playerScore > rivalScore,
        score_diff: playerScore - rivalScore,
        marvelous: marv,
        perfect: perf,
        great: great,
        good: good,
        bad: bad,
        miss: miss,
        combo: combo,
        ratio: ratio,
        rival_marvelous: rivalMarv,
        rival_perfect: rivalPerf,
        rival_great: rivalGreat,
        rival_good: rivalGood,
        rival_bad: rivalBad,
        rival_miss: rivalMiss,
        rival_combo: rivalCombo,
        rival_ratio: rivalRatio,
        mp_link: mpLink,
      };

      allBracketMapScores.push(mapScore);

      // Agrupar por Match
      const mId = row.match_id;
      if (!matchGroupsMap[mId]) {
        const matchData = row.matches;
        const isTeam1 = matchData?.team_1_id === player.team?.id;

        const teamName = isTeam1 ? matchData?.team_1?.name : matchData?.team_2?.name;
        const teamLogo = isTeam1 ? matchData?.team_1?.logo_url : matchData?.team_2?.logo_url;
        const teamScore = isTeam1 ? (matchData?.team_1_score || 0) : (matchData?.team_2_score || 0);

        const oppTeamName = isTeam1 ? matchData?.team_2?.name : matchData?.team_1?.name;
        const oppTeamLogo = isTeam1 ? matchData?.team_2?.logo_url : matchData?.team_1?.logo_url;
        const oppTeamScore = isTeam1 ? (matchData?.team_2_score || 0) : (matchData?.team_1_score || 0);

        matchGroupsMap[mId] = {
          match_id: mId,
          stage: matchData?.stage || 'BRACKETS',
          match_order: matchData?.match_order || 0,
          bracket_group: matchData?.bracket_group || 'winners',
          team_name: teamName || player.team?.name || 'Equipo',
          team_logo: teamLogo || player.team?.logo_url || null,
          team_score: teamScore,
          opponent_team_name: oppTeamName || 'Rival',
          opponent_team_logo: oppTeamLogo || null,
          opponent_team_score: oppTeamScore,
          series_won: teamScore > oppTeamScore,
          mp_link: mpLink,
          maps: [],
        };
      }

      matchGroupsMap[mId].maps.push(mapScore);
    });

    // Ordenar matches de brackets cronológicamente por match_order
    const bracketMatches = Object.values(matchGroupsMap).sort((a, b) => a.match_order - b.match_order);

    // 4. Calcular métricas globales del jugador en el torneo
    const allPlayedScores: number[] = [];
    const allPlayedAccs: number[] = [];

    // Sumar Qualifiers
    qualifierScores.forEach((q) => {
      if (q.best_score > 0) {
        allPlayedScores.push(q.best_score);
        allPlayedAccs.push(q.best_accuracy);
      }
    });

    // Sumar Brackets
    let bracketWonCount = 0;
    let bracketLostCount = 0;
    let peakScore = 0;
    let peakScoreMap = '';
    let peakScoreStage = '';

    allBracketMapScores.forEach((b) => {
      allPlayedScores.push(b.player_score);
      allPlayedAccs.push(b.player_acc);
      if (b.won) bracketWonCount++;
      else bracketLostCount++;

      if (b.player_score > peakScore) {
        peakScore = b.player_score;
        peakScoreMap = `${b.map_pattern} ${b.map_slot} - ${b.map_title}`;
        peakScoreStage = b.stage;
      }
    });

    // Revisar también peak en qualifiers
    qualifierScores.forEach((q) => {
      if (q.best_score > peakScore) {
        peakScore = q.best_score;
        peakScoreMap = `${q.pattern_type} ${q.slot} - ${q.title}`;
        peakScoreStage = 'QUALIFIERS';
      }
    });

    const totalMaps = allPlayedScores.length;
    const overallAvgScore =
      totalMaps > 0 ? Math.round(allPlayedScores.reduce((acc, s) => acc + s, 0) / totalMaps) : 0;
    const overallAvgAcc =
      totalMaps > 0
        ? Number((allPlayedAccs.reduce((acc, a) => acc + a, 0) / totalMaps).toFixed(2))
        : 0;

    const bracketTotal = bracketWonCount + bracketLostCount;
    const bracketWinrate =
      bracketTotal > 0 ? Number(((bracketWonCount / bracketTotal) * 100).toFixed(1)) : 0;

    const metrics: PlayerGlobalMetrics = {
      totalMapsPlayed: totalMaps,
      qualifierMapsPlayed: qualifierScores.filter((q) => q.best_score > 0).length,
      bracketMapsPlayed: allBracketMapScores.length,
      bracketMapsWon: bracketWonCount,
      bracketMapsLost: bracketLostCount,
      bracketWinrate: bracketWinrate,
      overallAvgScore: overallAvgScore,
      overallAvgAcc: overallAvgAcc,
      peakScore: peakScore,
      peakScoreMap: peakScoreMap || 'N/A',
      peakScoreStage: peakScoreStage || 'N/A',
    };

    const result: PlayerFullTournamentStats = {
      player,
      placement: playerPlacement,
      qualifiersSummary,
      qualifierScores,
      bracketMatches,
      allBracketMapScores,
      metrics,
    };

    playerStatsCache.set(actualPlayerId, result);
    playerStatsCache.set(playerId, result);
    if (player.nickname) {
      playerStatsCache.set(player.nickname.toLowerCase(), result);
    }
    return result;
  } catch (err) {
    console.error('Error fetching player tournament stats:', err);
    return null;
  }
}
