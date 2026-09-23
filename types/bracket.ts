export interface StaffMember {
  id?: string;
  nickname: string;
  roles?: string[];
  osu_id?: string;
  avatar_url?: string;
  custom_links?: { label: string; url: string }[];
}

export interface Lobby {
  id?: string;
  match_id?: string;
  status?: string;
  match_time?: string | null;
  lobby_link?: string | null;
  osu_match_id?: string | null;
  referee_id?: string | null;
  streamer_id?: string | null;
  caster_1_id?: string | null;
  caster_2_id?: string | null;
  referee?: StaffMember | null;
  streamer?: StaffMember | null;
  caster_1?: StaffMember | null;
  caster_2?: StaffMember | null;
}

export interface Player {
  id?: string;
  nickname: string;
  avatar_url?: string | null;
  osu_id?: string | number;
  country_rank?: number | string;
  seed?: number | string;
  status?: string;
  team_id?: string | null;
}

export interface Team {
  id?: string;
  name: string;
  logo_url?: string | null;
  seed?: number | null;
  players?: Player[];
}

export interface MatchResult {
  map_winner_id?: string;
}

export interface Match {
  id: string;
  stage: string;
  bracket_group: string;
  match_order: number;
  team_1_id?: string | null;
  team_2_id?: string | null;
  team_1_score?: number | null;
  team_2_score?: number | null;
  winner_id?: string | null;
  team_1?: Team | null;
  team_2?: Team | null;
  results?: MatchResult[];
  lobbies?: Lobby | Lobby[] | null;
}

/**
 * Normaliza la obtención del lobby independientemente de si Supabase lo retorna
 * como un objeto único o como un array de lobbies.
 */
export function getSafeLobby(match: Match | null | undefined): Lobby | null {
  if (!match?.lobbies) return null;
  if (Array.isArray(match.lobbies)) {
    return match.lobbies.length > 0 ? match.lobbies[0] : null;
  }
  return match.lobbies;
}
