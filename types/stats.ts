export type StatFilter = 'score' | 'accuracy' | 'marvelous_rate' | 'mapa_ratio' | 'error_rate';

export interface PlayerJudgment {
  m: number;
  pft: number;
  g: number;
  go: number;
  b: number;
  mi: number;
}

export interface ProcessedScore {
  id?: string;
  player_id?: string;
  nickname: string;
  osu_id?: string | number | null;
  avatar_url?: string | null;
  team?: string;
  team_logo?: string | null;
  mp_link?: string | null;
  score: number;
  accuracy: number;
  marvelous_rate: number;
  mapa_ratio: number;
  error_rate: number;
  judgments: PlayerJudgment;
}

export interface BeatmapData {
  id: string;
  stage_id: string;
  beatmap_id: number;
  banner_id: number;
  title: string;
  artist: string;
  difficulty_name: string;
  mapper: string;
  mapper_id?: string | number | null;
  sr: number;
  bpm: number;
  length: number;
  od: number;
  combo: number;
  pattern_type: 'RC' | 'LN' | 'HB' | 'SV' | 'TB' | string;
  slot: number;
  is_custom_map?: boolean;
  is_custom_song?: boolean;
  stages?: { name: string };
}

export interface Stage {
  id: string;
  name: string;
  is_published: boolean;
}

export interface MapSummaryStats {
  highScore: number;
  avgScore: number;
  avgAcc: number;
  totalPlays: number;
  totalMatches?: number;
  bestPlayer?: string;
}
