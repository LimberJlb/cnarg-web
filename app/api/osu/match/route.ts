import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function getOsuToken() {
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_OSU_CLIENT_ID, 
      client_secret: process.env.OSU_CLIENT_SECRET,    
      grant_type: 'client_credentials',
      scope: 'public'
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { matchId, internalMatchId, mode } = body;

    // --- LIMPIEZA DEL MATCH ID ---
    // Si pegan el link entero: https://osu.ppy.sh/community/matches/120587067
    if (typeof matchId === 'string' && matchId.includes('matches/')) {
      const parts = matchId.split('matches/');
      matchId = parts[1].split('/')[0].split('?')[0]; // Extrae solo los números
    }

    // Validamos que el ID sea un número
    if (!matchId || isNaN(Number(matchId))) {
      return NextResponse.json({ 
        success: false, 
        error: "ID de sala inválido. Pegá el link completo o solo los números." 
      }, { status: 400 });
    }

    const token = await getOsuToken();

    // 1. Obtener datos de osu!
    const osuRes = await fetch(`https://osu.ppy.sh/api/v2/matches/${matchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Si la API de osu! falla, capturamos el error antes de intentar hacer .json()
    if (!osuRes.ok) {
      const errorData = await osuRes.json().catch(() => ({}));
      return NextResponse.json({ 
        success: false, 
        error: `Error osu! API: ${osuRes.statusText}` 
      }, { status: osuRes.status });
    }

    const matchData = await osuRes.json();

    // 2. Cargar jugadores y mapas de la DB
    const [{ data: allPlayers }, { data: allMaps }] = await Promise.all([
      supabase.from('players').select('id, team_id, osu_id'),
      supabase.from('mappool_maps').select('id, beatmap_id')
    ]);

    const games = matchData.events.filter((e: any) => e.game).map((e: any) => e.game);
    const resultsToInsert: any[] = [];

    // 3. Procesamiento según el modo
    for (const game of games) {
      const internalMap = allMaps?.find(m => String(m.beatmap_id) === String(game.beatmap_id));
      if (!internalMap) continue; 

      if (mode === 'QUALIFIERS') {
        for (const s of game.scores) {
          const player = allPlayers?.find(p => String(p.osu_id) === String(s.user_id));
          if (player) {
            resultsToInsert.push({
              player_id: player.id,
              map_id: internalMap.id,
              score: s.score,
              accuracy: s.accuracy,
              marvelous: s.statistics.count_geki || 0,
              perfects: s.statistics.count_300 || 0,
              greats: s.statistics.count_katu || 0,
              goods: s.statistics.count_100 || 0,
              bads: s.statistics.count_50 || 0,
              misses: s.statistics.count_miss || 0,
              max_combo: s.max_combo || 0,
              mods: s.mods || []
            });
          }
        }
      } else {
        // --- MODO MATCH 1VS1 ---
        const { data: matchInfo, error: matchError } = await supabase
          .from('matches')
          .select('team_1_id, team_2_id')
          .eq('id', internalMatchId)
          .maybeSingle();

        if (matchError) throw new Error(`Error en DB: ${matchError.message}`);
        
        if (!matchInfo) {
          return NextResponse.json({ 
            success: false, 
            error: `El match con ID ${internalMatchId} no existe en la DB.` 
          }, { status: 404 });
        }

        let p1Data: any = { id: null, score: 0 };
        let p2Data: any = { id: null, score: 0 };

        for (const s of game.scores) {
          const player = allPlayers?.find(p => String(p.osu_id) === String(s.user_id));
          
          if (player) {
            const statsObj = {
              id: player.id,
              score: s.score,
              accuracy: s.accuracy,
              marvelous: s.statistics.count_geki || 0,
              perfects: s.statistics.count_300 || 0,
              greats: s.statistics.count_katu || 0,
              goods: s.statistics.count_100 || 0,
              bads: s.statistics.count_50 || 0,
              misses: s.statistics.count_miss || 0,
              combo: s.max_combo || 0,
              mods: s.mods || []
            };

            if (player.team_id === matchInfo.team_1_id) p1Data = statsObj;
            else if (player.team_id === matchInfo.team_2_id) p2Data = statsObj;
          }
        }

        if (p1Data.id || p2Data.id) {
          resultsToInsert.push({
            match_id: internalMatchId,
            map_id: internalMap.id,
            player_1_id: p1Data.id,
            player_2_id: p2Data.id,
            score_1: p1Data.score,
            score_2: p2Data.score,
            p1_accuracy: p1Data.accuracy || 0,
            p1_marvelous: p1Data.marvelous || 0,
            p1_perfects: p1Data.perfects || 0,
            p1_greats: p1Data.greats || 0,
            p1_goods: p1Data.goods || 0,
            p1_bads: p1Data.bads || 0,
            p1_misses: p1Data.misses || 0,
            p1_combo: p1Data.combo || 0,
            p1_mods: p1Data.mods || [],
            p2_accuracy: p2Data.accuracy || 0,
            p2_marvelous: p2Data.marvelous || 0,
            p2_perfects: p2Data.perfects || 0,
            p2_greats: p2Data.greats || 0,
            p2_goods: p2Data.goods || 0,
            p2_bads: p2Data.bads || 0,
            p2_misses: p2Data.misses || 0,
            p2_combo: p2Data.combo || 0,
            p2_mods: p2Data.mods || [],
            map_winner_id: p1Data.score > p2Data.score ? matchInfo.team_1_id : matchInfo.team_2_id
          });
        }
      }
    }

    if (resultsToInsert.length === 0) {
      return NextResponse.json({ success: false, error: "No se encontraron resultados válidos (jugadores o mapas no vinculados)." });
    }

    const table = mode === 'QUALIFIERS' ? 'qualifier_scores' : 'match_map_results';
    const { error: insertError } = await supabase.from(table).insert(resultsToInsert);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: resultsToInsert.length });

  } catch (error: any) {
    console.error("Error en Importador:", error.message);
    // IMPORTANTE: Retornamos siempre JSON, nunca texto plano ni HTML
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error desconocido en el servidor" 
    }, { status: 500 });
  }
}