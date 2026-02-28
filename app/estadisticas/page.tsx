'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function EstadisticasPage() {
  const [rondaActual, setRondaActual] = useState('QUALIFIERS');
  const [mapaSeleccionado, setMapaSeleccionado] = useState<string | null>(null);
  const [rondas, setRondas] = useState<any[]>([]);
  const [mappool, setMappool] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const patternWeights: { [key: string]: number } = {
    'RC': 1, 'HB': 2, 'LN': 3, 'SV': 4, 'TB': 5
  };

  // Función para cargar datos dependiendo de la ronda
  async function fetchStatsData() {
    setLoading(true);
    
    // 1. Cargar Rondas y Mappool (esto es general)
    const [stagesRes, mapsRes] = await Promise.all([
      supabase.from('stages').select('*').eq('is_published', true),
      supabase.from('mappool_maps').select('*, stages(name)')
    ]);

    if (stagesRes.data) setRondas(stagesRes.data);
    if (mapsRes.data) setMappool(mapsRes.data);

    // 2. Cargar Resultados según la ronda actual
    let finalResults: any[] = [];

    if (rondaActual.includes('QUALIFIERS')) {
      // BUSCAR EN TABLA DE QUALIFIERS
      const { data: qualyData } = await supabase
        .from('qualifier_scores')
        .select(`
          map_id,
          score,
          accuracy,
          player:player_id (nickname, team:team_id (name))
        `);

      if (qualyData) {
        // Adaptamos el formato de Qualifier al que espera el resto del código (player1, score_1)
        finalResults = qualyData.map(q => ({
          map_id: q.map_id,
          player1: q.player,
          score_1: q.score,
          player2: null, // No hay rival en qualies
          score_2: 0
        }));
      }
    } else {
      // BUSCAR EN TABLA DE MATCHES (BRACKETS)
      const { data: matchData } = await supabase
        .from('match_map_results')
        .select(`
          *,
          player1:player_1_id(nickname, team:team_id(name)),
          player2:player_2_id(nickname, team:team_id(name))
        `);
      finalResults = matchData || [];
    }

    setResultados(finalResults);
    
    // Auto-seleccionar primer mapa si no hay ninguno
    if (mapsRes.data && !mapaSeleccionado) {
      const firstMap = mapsRes.data.find(m => m.stages?.name === rondaActual);
      if (firstMap) setMapaSeleccionado(firstMap.id);
    }
    
    setLoading(false);
  }

  // Recargar cada vez que cambie la ronda
  useEffect(() => {
    fetchStatsData();
  }, [rondaActual]);

  // Mapas de la ronda actual ordenados
  const mapasRonda = mappool
    .filter(m => m.stages?.name === rondaActual)
    .sort((a, b) => {
      if (rondaActual === 'QUALIFIERS') return a.slot - b.slot;
      const weightA = patternWeights[a.pattern_type] || 99;
      const weightB = patternWeights[b.pattern_type] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return a.slot - b.slot;
    });

  const mapaData = mappool.find(m => m.id === mapaSeleccionado);

  const scoresDelMapa = resultados
    .filter(r => r.map_id === mapaSeleccionado)
    .flatMap(r => [
      { nickname: r.player1?.nickname, team: r.player1?.team?.name, score: r.score_1 },
      { nickname: r.player2?.nickname, team: r.player2?.team?.name, score: r.score_2 }
    ])
    .filter(s => s.nickname)
    .sort((a, b) => b.score - a.score);

  if (loading) return (
    <div className="min-h-screen bg-[#2e2e2e] flex items-center justify-center font-['ITCMachine'] text-[#fdc15a] text-4xl animate-pulse">
      CARGANDO ESTADÍSTICAS...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans pb-20">
      <div className="text-center pt-16 mb-10">
        <h1 className="font-['ITCMachine'] text-[80px] uppercase tracking-tighter leading-none">LEADERBOARDS</h1>
      </div>

      {/* 1. SELECTOR DE RONDAS */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 px-4">
        {rondas.map((ronda) => (
          <button
            key={ronda.id}
            onClick={() => {
              setRondaActual(ronda.name);
              // Al cambiar ronda, reseteamos el mapa seleccionado para que no quede uno viejo
              setMapaSeleccionado(null); 
            }}
            className={`font-['ITCMachine'] text-xl px-8 py-2 rounded-lg transition-all ${
              rondaActual === ronda.name ? 'bg-[#fdc15a] text-black shadow-lg scale-105' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {ronda.name}
          </button>
        ))}
      </div>

      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
        
        {/* 2. SIDEBAR SELECTOR DE MAPAS */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-4">Seleccionar Mapa</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
            {mapasRonda.map((m) => (
              <button
                key={m.id}
                onClick={() => setMapaSeleccionado(m.id)}
                className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${
                  mapaSeleccionado === m.id 
                    ? 'bg-[#fdc15a] border-[#fdc15a] text-black scale-105 z-10' 
                    : 'bg-[#1a1a1a] border-white/10 text-gray-400 hover:border-[#fdc15a]/50'
                }`}
              >
                <span className="text-[10px] font-black uppercase opacity-60">
                  {rondaActual === 'QUALIFIERS' ? 'Stage' : m.pattern_type}
                </span>
                <span className="text-xl font-black">{m.slot}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. PANEL DE DETALLE */}
        <div className="lg:col-span-9">
          {mapaData ? (
            <div className="bg-[#1a1a1a] rounded-sm border border-white/5 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="relative h-32 w-full overflow-hidden">
                <img 
                  src={`https://assets.ppy.sh/beatmaps/${mapaData.banner_id}/covers/cover.jpg`} 
                  className="w-full h-full object-cover opacity-40" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent"></div>
                <div className="absolute bottom-4 left-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">{mapaData.title}</h2>
                  <p className="text-[#fdc15a] text-xs font-bold uppercase tracking-widest">
                    {mapaData.artist} // {mapaData.difficulty_name}
                  </p>
                </div>
              </div>

              <div className="p-8">
                {scoresDelMapa.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                          <th className="pb-4 w-16">Rank</th>
                          <th className="pb-4">Jugador</th>
                          <th className="pb-4">Equipo</th>
                          <th className="pb-4 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {scoresDelMapa.map((s, idx) => (
                          <tr key={idx} className={`group transition-colors ${idx === 0 ? 'bg-[#fdc15a]/5' : ''}`}>
                            <td className="py-5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                idx === 0 ? 'bg-[#fdc15a] text-black shadow-[0_0_15px_#fdc15a]' : 'bg-white/5 text-gray-500'
                              }`}>
                                {idx + 1}
                              </div>
                            </td>
                            <td className="py-5 font-bold text-gray-200 group-hover:text-white transition-colors">
                              {s.nickname}
                            </td>
                            <td className="py-5 text-xs text-gray-500 uppercase tracking-wider">
                              {s.team}
                            </td>
                            <td className="py-5 text-right">
                              <span className={`font-mono font-black text-xl ${idx === 0 ? 'text-[#fdc15a]' : 'text-gray-300'}`}>
                                {s.score.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-lg">
                    <p className="text-gray-600 font-black uppercase text-xs tracking-[0.3em]">
                      No hay scores para este mapa en {rondaActual}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 text-gray-600 rounded-lg">
              <span className="font-['ITCMachine'] text-2xl mb-2 opacity-20">SELECT MAP</span>
              <p className="text-[10px] uppercase tracking-widest font-bold">Selecciona un slot del panel lateral</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}