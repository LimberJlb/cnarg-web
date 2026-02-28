import { supabase } from "../lib/supabase";

export async function getUpcomingLobbies() {
  const { data, error } = await supabase
    .from('lobbies')
    .select(`
      id,
      match_id,
      match_time,
      status,
      referee_id,
      streamer_id,
      caster_1_id,
      caster_2_id,
      matches!inner (
        stage,
        bracket_group,
        team_1_id,
        team_2_id,
        team_1:teams!team_1_id (name, logo_url),
        team_2:teams!team_2_id (name, logo_url)
      )
    `)
    // 1. FILTRO: El estado NO debe ser 'finished'
    .neq('status', 'finished')
    
    // 2. FILTRO: Ambos equipos deben estar definidos (evita los TBD)
    .not('matches.team_1_id', 'is', null)
    .not('matches.team_2_id', 'is', null)
    
    // 3. ORDEN: Cronológico ascendente (el más cercano primero)
    .order('match_time', { ascending: true })
    
    // 4. LÍMITE: Mostramos los próximos 8 cruces confirmados
    .limit(8);

  if (error) {
    console.error('Error cargando agenda:', error);
    return [];
  }
  
  return data;
}