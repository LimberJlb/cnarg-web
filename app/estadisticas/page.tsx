'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// 🔴 1. Agregamos los nuevos filtros al Type
type StatFilter = 'score' | 'accuracy' | 'marvelous_rate' | 'mapa_ratio' | 'error_rate' | 'miss_rate';

export default function EstadisticasPage() {
  const [rondaActual, setRondaActual] = useState('QUALIFIERS');
  const [mapaSeleccionado, setMapaSeleccionado] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<StatFilter>('score');
  const [rondas, setRondas] = useState<any[]>([]);
  const [mappool, setMappool] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const patternWeights: { [key: string]: number } = {
    'RC': 1, 'HB': 2, 'LN': 3, 'SV': 4, 'TB': 5
  };

  async function fetchStatsData() {
    setLoading(true);
    
    const [stagesRes, mapsRes] = await Promise.all([
      supabase.from('stages').select('*').eq('is_published', true),
      supabase.from('mappool_maps').select('*, stages(name)')
    ]);

    if (stagesRes.data) setRondas(stagesRes.data);
    if (mapsRes.data) setMappool(mapsRes.data);

    let finalResults: any[] = [];

    if (rondaActual.includes('QUALIFIERS')) {
      const { data: qualyData } = await supabase
        .from('qualifier_scores')
        .select(`
          map_id,
          score,
          accuracy,
          marvelous, perfects, greats, goods, bads, misses,
          player:player_id (nickname, team:team_id (name))
        `);

      if (qualyData) {
        finalResults = qualyData.map(q => ({
          map_id: q.map_id,
          player1: q.player,
          score_1: q.score,
          accuracy_1: q.accuracy,
          m_1: q.marvelous, p_1: q.perfects, g_1: q.greats, go_1: q.goods, b_1: q.bads, mi_1: q.misses,
          player2: null, 
          score_2: 0
        }));
      }
    } else {
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
    
    if (mapsRes.data && !mapaSeleccionado) {
      const firstMap = mapsRes.data.find(m => m.stages?.name === rondaActual);
      if (firstMap) setMapaSeleccionado(firstMap.id);
    }
    
    setLoading(false);
  }

  useEffect(() => {
    fetchStatsData();
  }, [rondaActual]);

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

  const scoresDelMapa = useMemo(() => {
    const processPlayer = (player: any, score: number, acc: number, m: number, pft: number, g: number, go: number, b: number, mi: number) => {
      if (!player?.nickname) return null;
      
      const totalHits = (m || 0) + (pft || 0) + (g || 0) + (go || 0) + (b || 0) + (mi || 0);
      
      // 🔴 2. Cálculos matemáticos de las nuevas métricas
      const marvRate = totalHits > 0 ? ((m || 0) / totalHits) * 100 : 0;
      const mapaRatio = (pft || 0) > 0 ? (m || 0) / pft : (m || 0); // Si no hay perfects, el ratio es igual a los marv
      const errorRate = totalHits > 0 ? (((g || 0) + (go || 0) + (b || 0) + (mi || 0)) / totalHits) * 100 : 0;
      const missRate = totalHits > 0 ? ((mi || 0) / totalHits) * 100 : 0;
      
      return {
        nickname: player.nickname,
        team: player.team?.name,
        score: score || 0,
        accuracy: acc || 0,
        marvelous_rate: marvRate,
        mapa_ratio: mapaRatio,
        error_rate: errorRate,
        miss_rate: missRate,
        judgments: { m: m || 0, pft: pft || 0, g: g || 0, go: go || 0, b: b || 0, mi: mi || 0 }
      };
    };

    const data = resultados
      .filter(r => r.map_id === mapaSeleccionado)
      .flatMap(r => [
        processPlayer(r.player1, r.score_1, r.p1_accuracy || r.accuracy_1, r.p1_marvelous || r.m_1, r.p1_perfects || r.p_1, r.p1_greats || r.g_1, r.p1_goods || r.go_1, r.p1_bads || r.b_1, r.p1_misses || r.mi_1),
        processPlayer(r.player2, r.score_2, r.p2_accuracy, r.p2_marvelous, r.p2_perfects, r.p2_greats, r.p2_goods, r.p2_bads, r.p2_misses)
      ])
      .filter(Boolean) as any[];

    // 🔴 3. Ordenamiento Dinámico: En errores y misses, gana el que tiene el número más BAJO.
    return data.sort((a, b) => {
      if (statFilter === 'error_rate' || statFilter === 'miss_rate') {
        return a[statFilter] - b[statFilter]; // Ascendente (Menor es mejor)
      }
      return b[statFilter] - a[statFilter]; // Descendente (Mayor es mejor)
    });
  }, [resultados, mapaSeleccionado, statFilter]);

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
                
                {/* 🔴 4. FILTROS ACTUALIZADOS CON LAS NUEVAS OPCIONES */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-6">
                  <button 
                    onClick={() => setStatFilter('score')} 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded transition-all ${statFilter === 'score' ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    Score
                  </button>
                  <button 
                    onClick={() => setStatFilter('accuracy')} 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded transition-all ${statFilter === 'accuracy' ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    Accuracy
                  </button>
                  <button 
                    onClick={() => setStatFilter('marvelous_rate')} 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded transition-all ${statFilter === 'marvelous_rate' ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    % Marv
                  </button>
                  <button 
                    onClick={() => setStatFilter('mapa_ratio')} 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded transition-all ${statFilter === 'mapa_ratio' ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    MA/PA Ratio
                  </button>
                  <button 
                    onClick={() => setStatFilter('error_rate')} 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded transition-all ${statFilter === 'error_rate' ? 'bg-red-500 text-white shadow-[0_0_10px_#ef4444]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    Error Rate
                  </button>
                  <button 
                    onClick={() => setStatFilter('miss_rate')} 
                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded transition-all ${statFilter === 'miss_rate' ? 'bg-red-500 text-white shadow-[0_0_10px_#ef4444]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                  >
                    Miss Rate
                  </button>
                </div>

                {scoresDelMapa.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                          <th className="pb-4 w-16">Rank</th>
                          <th className="pb-4">Jugador</th>
                          <th className="pb-4">Equipo</th>
                          <th className="pb-4 text-right">
                            {/* Títulos dinámicos de columna */}
                            {statFilter === 'score' && 'Score'}
                            {statFilter === 'accuracy' && 'Accuracy'}
                            {statFilter === 'marvelous_rate' && 'Marvelous %'}
                            {statFilter === 'mapa_ratio' && 'MA/PA Ratio'}
                            {statFilter === 'error_rate' && 'Error Rate %'}
                            {statFilter === 'miss_rate' && 'Miss Rate %'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {scoresDelMapa.map((s, idx) => {
                          const accFormateada = s.accuracy <= 1 ? (s.accuracy * 100).toFixed(2) : Number(s.accuracy).toFixed(2);
                          // Para error y miss rate, el top rank es gris/rojo claro en vez de amarillo para darle toque visual
                          const isNegativeStat = statFilter === 'error_rate' || statFilter === 'miss_rate';
                          const rankColor = isNegativeStat ? 'bg-red-500 text-white shadow-[0_0_15px_#ef4444]' : 'bg-[#fdc15a] text-black shadow-[0_0_15px_#fdc15a]';
                          const textColor = isNegativeStat ? 'text-red-400' : 'text-[#fdc15a]';
                          const rowBgColor = isNegativeStat ? 'bg-red-500/5' : 'bg-[#fdc15a]/5';

                          return (
                            <tr key={idx} className={`group transition-colors ${idx === 0 ? rowBgColor : ''}`}>
                              <td className="py-5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                  idx === 0 ? rankColor : 'bg-white/5 text-gray-500'
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
                              <td className="py-5 text-right relative">
                                
                                <div className="relative group/tooltip inline-block">
                                  <span className={`font-mono font-black text-xl cursor-help border-b border-dotted border-white/20 pb-0.5 ${idx === 0 ? textColor : 'text-gray-300'}`}>
                                    {/* 🔴 5. Renderizado del valor según el filtro seleccionado */}
                                    {statFilter === 'score' && s.score.toLocaleString()}
                                    {statFilter === 'accuracy' && `${accFormateada}%`}
                                    {statFilter === 'marvelous_rate' && `${s.marvelous_rate.toFixed(2)}%`}
                                    {statFilter === 'mapa_ratio' && s.mapa_ratio.toFixed(2)}
                                    {statFilter === 'error_rate' && `${s.error_rate.toFixed(2)}%`}
                                    {statFilter === 'miss_rate' && `${s.miss_rate.toFixed(2)}%`}
                                  </span>
                                  
                                  {/* Caja Flotante (Judgments) - SIN CAMBIOS */}
                                  <div className="absolute bottom-full right-0 mb-3 hidden group-hover/tooltip:block z-50">
                                    <div className="bg-[#1a1a1a] border border-white/10 p-4 rounded-md shadow-2xl min-w-[160px] text-left relative">
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-cyan-400">Marv</span> <span className="text-right text-white">{s.judgments.m}</span>
                                        <span className="text-yellow-400">Perf</span> <span className="text-right text-white">{s.judgments.pft}</span>
                                        <span className="text-green-400">Great</span> <span className="text-right text-white">{s.judgments.g}</span>
                                        <span className="text-orange-400">Good</span> <span className="text-right text-white">{s.judgments.go}</span>
                                        <span className="text-red-400">Bad</span> <span className="text-right text-white">{s.judgments.b}</span>
                                        <span className="text-zinc-500 border-t border-white/10 mt-1 pt-1.5">Miss</span> 
                                        <span className="text-right text-white border-t border-white/10 mt-1 pt-1.5">{s.judgments.mi}</span>
                                      </div>
                                      <div className="absolute top-full right-4 border-[6px] border-transparent border-t-[#1a1a1a]"></div>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          );
                        })}
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