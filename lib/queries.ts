// src/lib/queries.ts (o donde manejes tus llamadas a Supabase)

import { supabase } from "../lib/supabase";
export async function getUpcomingLobbies() {
  const { data, error } = await supabase
    .from('lobbies')
    .select(`
      id,
      match_id,
      match_time,
      status,
      matches (
        stage,
        team_1:teams!team_1_id (name, logo_url),
        team_2:teams!team_2_id (name, logo_url)
      )
    `)
    .order('match_time', { ascending: true })
    .limit(8);

  if (error) console.error('Error cargando agenda:', error);
  return data;
}