export interface QualifierRawScore {
  id: string;
  player_id: string;
  map_id: string;
  score: number;
  accuracy: number;
  created_at: string;
  player?: {
    id: string;
    nickname: string;
    avatar_url: string | null;
    osu_id: number;
    team?: {
      name: string;
      logo_url: string | null;
    } | null;
  } | null;
}

export interface QualifierAttempt {
  score: number;
  accuracy: number;
  created_at: string;
}

export interface PlayerMapQualifierData {
  map_id: string;
  bestScore: number;
  bestAccuracy: number;
  rank: number;
  attempts: QualifierAttempt[];
}

export interface QualifierPlayerResult {
  seed: number;
  player_id: string;
  nickname: string;
  avatar_url: string | null;
  osu_id: number;
  team_name?: string;
  team_logo?: string | null;
  avgRank: number;
  avgScore: number;
  totalScore: number;
  sumRank: number;
  playedMapsCount: number;
  maps: Record<string, PlayerMapQualifierData>;
}

export interface QualifierMapSummary {
  map_id: string;
  highScore: number;
  avgScore: number;
  avgAcc: number;
  totalPlayers: number;
}
