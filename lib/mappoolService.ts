import { supabase } from './supabase';

export async function fetchAndSaveBeatmap(
  beatmapId: number, 
  stageId: string, 
  pattern: 'RC' | 'LN' | 'HB' | 'SV' | 'TB', 
  slot: number,
  isCustomMap: boolean,    // Nuevo argumento
  isCustomSong: boolean,   // Nuevo argumento
  artistPhoto: string      // Nuevo argumento
) {
  // Llamada a nuestro puente interno
  const response = await fetch(`/api/osu/beatmap?id=${beatmapId}`);
  const data = await response.json();

  if (!response.ok) {
    // Si hay un error, lanzamos solo el mensaje de texto, no el objeto entero
    throw new Error(data.error || 'Error desconocido al buscar el mapa');
  }

  const mapData = {
    stage_id: stageId,
    beatmap_id: beatmapId,
    title: data.beatmapset.title,
    artist: data.beatmapset.artist,
    mapper: data.beatmapset.creator,
    mapper_id: data.beatmapset.user_id,
    difficulty_name: data.version,
    sr: data.difficulty_rating,
    bpm: data.bpm,
    length: data.total_length,
    od: data.accuracy,
    combo: data.max_combo,
    banner_id: data.beatmapset_id,
    pattern_type: pattern,
    slot: slot,
    // Coincide con tu base de datos
    is_custom_map: isCustomMap,
    is_custom_song: isCustomSong,
    artist_photo_url: artistPhoto
  };

  const { error: dbError } = await supabase
    .from('mappool_maps')
    .upsert(mapData, { onConflict: 'stage_id, pattern_type, slot' });

  if (dbError) throw new Error("Error en Base de Datos: " + dbError.message);
  
  return mapData;
}