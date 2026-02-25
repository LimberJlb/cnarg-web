'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function MappoolPage() {
  const [rondaActual, setRondaActual] = useState('QUARTERFINALS');
  const [todosLosMapas, setTodosLosMapas] = useState<any[]>([]);
  const [rondas, setRondas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const patternWeights: { [key: string]: number } = {
    'RC': 1, 'HB': 2, 'LN': 3, 'SV': 4, 'TB': 5
  };

  useEffect(() => {
    async function fetchData() {
      const [stagesRes, mapsRes] = await Promise.all([
        supabase.from('stages').select('*').eq('is_published', true),
        supabase.from('mappool_maps').select('*, stages(name)')
      ]);

      if (stagesRes.data) setRondas(stagesRes.data);
      if (mapsRes.data) setTodosLosMapas(mapsRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    return () => audio?.pause();
  }, [audio]);

  const getPatternColor = (type: string) => {
    if (rondaActual === 'QUALIFIERS') return '#fdc15a';
    switch (type) {
      case 'RC': return '#70ade3'; case 'LN': return '#ff4d4d';
      case 'HB': return '#ff9933'; case 'SV': return '#008000';
      case 'TB': return '#800080'; default: return '#f8efe2';
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePlay = (beatmapsetId: number) => {
    if (playingId === beatmapsetId) {
      audio?.pause();
      setPlayingId(null);
    } else {
      audio?.pause();
      const newAudio = new Audio(`https://b.ppy.sh/preview/${beatmapsetId}.mp3`);
      newAudio.volume = 0.4;
      newAudio.play();
      setAudio(newAudio);
      setPlayingId(beatmapsetId);
      newAudio.onended = () => setPlayingId(null);
    }
  };

  const mapasFiltrados = todosLosMapas
    .filter(m => m.stages?.name === rondaActual)
    .sort((a, b) => {
      if (rondaActual === 'QUALIFIERS') return a.slot - b.slot;
      const weightA = patternWeights[a.pattern_type] || 99;
      const weightB = patternWeights[b.pattern_type] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return a.slot - b.slot;
    });

  if (loading) return (
    <div className="min-h-screen bg-[#2e2e2e] flex items-center justify-center font-['ITCMachine'] text-[#fdc15a] text-4xl animate-pulse">
      CARGANDO POOL...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-14">
      <div className="text-center mb-12 mt-15">
        <h1 className="font-['ITCMachine'] text-[120px] uppercase tracking-tighter leading-none">MAPPOOL</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {rondas.map((ronda) => (
          <button
            key={ronda.id}
            onClick={() => setRondaActual(ronda.name)}
            className={`font-['ITCMachine'] text-2xl px-10 py-3 rounded-xl transition-all transform hover:scale-105 ${
              rondaActual === ronda.name ? 'bg-[#fdc15a] text-[#2e2e2e] shadow-lg' : 'bg-white text-[#2e2e2e] opacity-80'
            }`}
          >
            {ronda.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[2px] w-full max-w-[1200px] mx-auto font-sans shadow-2xl">
        {/* CABECERA AMARILLA */}
        <div className="flex h-[35px] w-full items-stretch overflow-hidden mb-2 px-0 opacity-90 cursor-default">
          <div className="w-[90px] bg-[#fdc15a] flex items-center justify-center text-[#2e2e2e] font-black text-[14px] uppercase tracking-tighter flex-shrink-0">
            {rondaActual === 'QUALIFIERS' ? 'POOL' : 'STAGE'}
          </div>
          <div className="w-[15px] bg-[#fdc15a] flex-shrink-0"></div>
          <div className="flex-grow bg-[#fdc15a] flex items-center px-8 border-l border-black/10">
            <span className="font-black text-[14px] uppercase text-[#2e2e2e] tracking-widest">Artist | Title - Difficulty</span>
          </div>
          <div className="flex flex-shrink-0 text-[#2e2e2e] font-black text-[14px]">
            <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">BPM</div>
            <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">SR</div>
            <div className="w-[70px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">LENGTH</div>
            <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">COMBO</div>
            <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">OD</div>
            <div className="w-[120px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">MAPPER</div>
            <div className="w-[90px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10 rounded-tr-sm">MAP ID</div>
          </div>
        </div>

        {mapasFiltrados.map((mapa) => {
          const isElite = mapa.is_custom_map && mapa.is_custom_song;
          const isCustom = mapa.is_custom_map && !mapa.is_custom_song;
          const isQualifiers = rondaActual === 'QUALIFIERS';

          return (
            <div 
              key={mapa.id} 
              className={`flex h-[75px] w-full items-stretch overflow-hidden group transition-all duration-500
                ${isElite ? 'ring-4 ring-[#fdc15a] shadow-[0_0_40px_rgba(253,193,90,0.5)] z-20 scale-[1.02] my-2 rounded-md bg-gradient-to-r from-[#fdc15a]/10 to-transparent' : ''}
                ${isCustom ? 'ring-2 ring-[#fdc15a]/40 shadow-[0_0_20px_rgba(253,193,90,0.2)] z-10 scale-[1.01] my-1 rounded-sm' : ''}
                ${!isElite && !isCustom ? 'border-b border-white/5' : ''}
              `}
            >
              {/* SLOT LADO IZQUIERDO */}
              <div className={`w-[80px] flex items-center justify-center font-bold flex-shrink-0 cursor-default
                ${isElite || isCustom || isQualifiers ? 'bg-[#fdc15a] text-black' : 'bg-white text-[#2e2e2e]'}`}>
                {isQualifiers ? (
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[10px] uppercase font-black opacity-60">Stage</span>
                    <span className="text-[22px] font-black">{mapa.slot}</span>
                  </div>
                ) : (
                  <span className="text-[18px]">{mapa.pattern_type}{mapa.slot}</span>
                )}
              </div>

              {/* BARRA DE COLOR DEL PATRÓN */}
              <div className={`w-[25px] flex items-center justify-center flex-shrink-0 relative border-l border-black/5
                ${isElite || isCustom || isQualifiers ? 'bg-[#fdc15a]/10' : 'bg-white'}`}>
                <div className="w-[8px] h-[45px] rounded-full" style={{ backgroundColor: getPatternColor(mapa.pattern_type) }}></div>
              </div>

              {/* BANNER CLICKEABLE CON ZOOM EFFECT */}
              <a 
                href={`https://osu.ppy.sh/b/${mapa.beatmap_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow relative bg-[#1a1a1a] flex items-center px-8 min-w-0 border-l border-white/5 overflow-hidden justify-between group/banner"
              >
                {/* Imagen con ZOOM */}
                <img 
                  src={`https://assets.ppy.sh/beatmaps/${mapa.banner_id}/covers/cover.jpg`} 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover/banner:scale-110" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
                
                {/* CONTENIDO IZQUIERDA: PLAY + INFO */}
                <div className="relative z-10 flex items-center min-w-0 flex-grow">
                  {mapa.is_custom_song && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); // Evita abrir el link de osu
                        e.stopPropagation();
                        togglePlay(mapa.banner_id);
                      }}
                      className={`relative z-30 mr-5 w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-all duration-300
                        ${playingId === mapa.banner_id 
                          ? 'bg-white text-black border-white shadow-[0_0_15px_white]' 
                          : 'bg-black/40 text-[#fdc15a] border-[#fdc15a] hover:bg-[#fdc15a] hover:text-black shadow-[0_0_10px_rgba(253,193,90,0.3)]'
                        }`}
                    >
                      {playingId === mapa.banner_id ? <span className="text-xl">❚❚</span> : <span className="text-xl ml-1">▶</span>}
                    </button>
                  )}

                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[17px] text-white drop-shadow-lg">
                        {mapa.title}
                      </span>
                      {isElite && <span className="bg-[#fdc15a] text-black text-[10px] px-3 py-1 rounded-sm font-black animate-pulse shadow-md">ORIGINAL SONG</span>}
                      {isCustom && <span className="border-2 border-[#fdc15a] text-[#fdc15a] text-[10px] px-2 py-0.5 rounded-sm font-black">CUSTOM MAP</span>}
                    </div>
                    <span className={`block text-[12px] font-normal uppercase tracking-widest ${isElite || isQualifiers ? 'text-[#fdc15a]' : 'text-gray-400'}`}>
                      {mapa.artist} // {mapa.difficulty_name}
                    </span>
                  </div>
                </div>

                {/* CONTENIDO DERECHA: FOTO ARTISTA */}
                {mapa.artist_photo_url && (
                  <div className="relative z-10 ml-4 flex-shrink-0">
                    <img 
                      src={mapa.artist_photo_url} 
                      className="w-12 h-12 rounded-full border-2 border-[#fdc15a] object-cover shadow-[0_0_15px_rgba(253,193,90,0.4)] transition-transform duration-500 group-hover/banner:rotate-6" 
                      alt="Artist" 
                    />
                  </div>
                )}
              </a>

              {/* BLOQUES DE ESTADÍSTICAS */}
              <div className="flex flex-shrink-0 text-white font-bold text-[13px] cursor-default">
                <div className="w-[60px] bg-[#3a3a3a] flex items-center justify-center border-r border-white/5">{mapa.bpm}</div>
                <div className="w-[60px] bg-[#444444] flex items-center justify-center border-r border-white/5 text-[#fdc15a]">{mapa.sr.toFixed(2)}*</div>
                <div className="w-[70px] bg-[#3a3a3a] flex items-center justify-center border-r border-white/5">
                  {Math.floor(mapa.length / 60)}:{(mapa.length % 60).toString().padStart(2, '0')}
                </div>
                <div className="w-[60px] bg-[#444444] flex items-center justify-center border-r border-white/5 text-[#fdc15a]">{mapa.combo}x</div>
                <div className="w-[60px] bg-[#3a3a3a] flex items-center justify-center border-r border-white/5">{mapa.od}</div>
                
                {/* MAPPER */}
                <a 
                  href={mapa.mapper_id ? `https://osu.ppy.sh/users/${mapa.mapper_id}` : `https://osu.ppy.sh/users/${encodeURIComponent(mapa.mapper)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-[120px] bg-[#444444] relative flex items-center justify-center px-2 overflow-hidden group/mapper transition-all"
                >
                  {mapa.mapper_id && (
                    <>
                      <img src={`https://a.ppy.sh/${mapa.mapper_id}`} className="absolute inset-0 w-full h-full object-cover blur-[1px] opacity-40 grayscale group-hover/mapper:grayscale-0 group-hover/mapper:opacity-80 transition-all duration-500" alt="" />
                      <div className="absolute inset-0 bg-black/50 group-hover/mapper:bg-black/20 transition-colors"></div>
                    </>
                  )}
                  <span className="relative z-10 truncate text-[12px] font-normal uppercase text-gray-200 group-hover/mapper:text-[#fdc15a] transition-colors drop-shadow-md">{mapa.mapper}</span>
                </a>
                
                {/* BOTÓN COPIAR ID */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(mapa.beatmap_id.toString());
                  }}
                  className={`w-[90px] flex items-center justify-center transition-all relative overflow-hidden font-black
                    ${isElite || isQualifiers ? 'bg-[#fdc15a] text-black hover:bg-white' : 'bg-[#3a3a3a] text-[#fdc15a] hover:bg-white hover:text-black'}`}
                >
                  <span className={`text-[12px] transition-all duration-300 ${copiedId === mapa.beatmap_id.toString() ? 'opacity-0 scale-50' : 'opacity-100'}`}>
                    {mapa.beatmap_id}
                  </span>
                  <div className={`absolute inset-0 flex items-center justify-center text-[10px] uppercase transition-all duration-300 ${copiedId === mapa.beatmap_id.toString() ? 'top-0 opacity-100' : 'top-full opacity-0'}`}>¡COPIADO!</div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}