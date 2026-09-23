'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';

const stageOrder: Record<string, number> = {
  QUALIFIERS: 0,
  'ROUND OF 16': 1,
  QUARTERFINALS: 2,
  SEMIFINALS: 3,
  FINALS: 4,
  'GRAND FINALS': 5,
};

const patternWeights: Record<string, number> = {
  RC: 1,
  HB: 2,
  LN: 3,
  SV: 4,
  TB: 5,
};

const QUALIFIERS_PATTERNS: Record<number, string> = {
  1: 'SV',
  2: 'RC',
  3: 'HB',
  4: 'LN',
  5: 'LN',
  6: 'HB',
  7: 'RC',
  8: 'RC',
};

const getMapPattern = (mapa: any): string => {
  if (mapa?.stages?.name?.toUpperCase().includes('QUALIFIER')) {
    return QUALIFIERS_PATTERNS[mapa.slot] || mapa.pattern_type || 'RC';
  }
  return mapa?.pattern_type || 'RC';
};

interface CachedMappoolData {
  rondas: any[];
  todosLosMapas: any[];
}

let mappoolCache: CachedMappoolData | null = null;

async function fetchWithRetry<T = any>(
  fn: () => PromiseLike<{ data: T | null; error: any }> | Promise<{ data: T | null; error: any }>,
  retries = 2,
  delayMs = 1200
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fn();
      if (!res.error && res.data) return res;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return res;
      }
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return { data: null, error: err };
      }
    }
  }
  return { data: null, error: new Error('Exceeded retries') };
}

export default function MappoolPage() {
  const [rondaActual, setRondaActual] = useState('QUALIFIERS');
  const [todosLosMapas, setTodosLosMapas] = useState<any[]>([]);
  const [rondas, setRondas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'id' | 'mp' | null>(null);

  // Filtros de búsqueda y patrones
  const [patternFilter, setPatternFilter] = useState<string>('ALL');
  const [customTypeFilter, setCustomTypeFilter] = useState<'ALL' | 'SONGS' | 'MAPS'>('ALL');
  const [onlyCustomFilter, setOnlyCustomFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para audio y Easter Egg
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [eggStep, setEggStep] = useState(0);
  const [showEgg, setShowEgg] = useState(false);

  // Secuencia del Easter Egg
  const EGG_SEQUENCE = ['QUALIFIERS', 'QUARTERFINALS', 'L', 'M', 'P1', 'P2'];

  const handleEgg = (step: string) => {
    if (step === EGG_SEQUENCE[eggStep]) {
      const nextStep = eggStep + 1;
      if (nextStep === EGG_SEQUENCE.length) {
        triggerEasterEgg();
        setEggStep(0);
      } else {
        setEggStep(nextStep);
      }
    } else {
      setEggStep(0);
    }
  };

  const triggerEasterEgg = () => {
    const sfx = new Audio(
      'https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/assets/starsky.ogg'
    );
    sfx.volume = 0.6;
    sfx.play();

    setShowEgg(true);
    setTimeout(() => setShowEgg(false), 5000);
  };

  useEffect(() => {
    document.title = 'Mappool | CNARG 4K 2026';
    async function fetchData() {
      if (mappoolCache) {
        setRondas(mappoolCache.rondas);
        setTodosLosMapas(mappoolCache.todosLosMapas);
        if (mappoolCache.rondas.length > 0) {
          setRondaActual(mappoolCache.rondas[0].name);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [stagesRes, mapsRes] = await Promise.all([
          fetchWithRetry(() => supabase.from('stages').select('*').eq('is_published', true)),
          fetchWithRetry(() => supabase.from('mappool_maps').select('*, stages(name)')),
        ]);

        let sortedStages: any[] = [];
        if (stagesRes.data) {
          sortedStages = [...stagesRes.data].sort((a, b) => {
            const orderA = stageOrder[a.name.toUpperCase()] ?? 99;
            const orderB = stageOrder[b.name.toUpperCase()] ?? 99;
            return orderA - orderB;
          });
          setRondas(sortedStages);

          if (sortedStages.length > 0) {
            setRondaActual(sortedStages[0].name);
          }
        }

        const mapsData = (mapsRes.data as any[]) || [];
        setTodosLosMapas(mapsData);

        mappoolCache = {
          rondas: sortedStages,
          todosLosMapas: mapsData,
        };
      } catch (err) {
        console.error('Error cargando mappool:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const isOriginalesView = rondaActual === 'ORIGINALES';
  const isQualifiers = !isOriginalesView && rondaActual.toUpperCase().includes('QUALIFIER');

  // Conteo de contenido original y custom
  const totalOriginales = useMemo(
    () => todosLosMapas.filter((m) => m.is_custom_map || m.is_custom_song).length,
    [todosLosMapas]
  );
  const totalSongs = useMemo(
    () => todosLosMapas.filter((m) => m.is_custom_song).length,
    [todosLosMapas]
  );
  const totalMaps = useMemo(
    () => todosLosMapas.filter((m) => m.is_custom_map && !m.is_custom_song).length,
    [todosLosMapas]
  );

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'RC':
        return '#70ade3';
      case 'LN':
        return '#ff4d4d';
      case 'HB':
        return '#ff9933';
      case 'SV':
        return '#008000';
      case 'TB':
        return '#800080';
      default:
        return '#fdc15a';
    }
  };

  const handleCopy = (id: string, type: 'id' | 'mp' = 'id') => {
    const textToCopy = type === 'mp' ? `!mp map ${id}` : id;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  // Reproductor de solo custom songs
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

  // Mapas de la ronda actual u originals ordenados
  const mapasRonda = useMemo(() => {
    if (isOriginalesView) {
      return todosLosMapas
        .filter((m) => m.is_custom_map || m.is_custom_song)
        .sort((a, b) => {
          const orderA = stageOrder[a.stages?.name?.toUpperCase()] ?? 99;
          const orderB = stageOrder[b.stages?.name?.toUpperCase()] ?? 99;
          if (orderA !== orderB) return orderA - orderB;

          const isAQual = a.stages?.name?.toUpperCase().includes('QUALIFIER');
          const isBQual = b.stages?.name?.toUpperCase().includes('QUALIFIER');
          if (isAQual && isBQual) return a.slot - b.slot;

          const weightA = patternWeights[a.pattern_type] || 99;
          const weightB = patternWeights[b.pattern_type] || 99;
          if (weightA !== weightB) return weightA - weightB;
          return a.slot - b.slot;
        });
    }

    return todosLosMapas
      .filter((m) => m.stages?.name === rondaActual)
      .sort((a, b) => {
        if (isQualifiers) return a.slot - b.slot;
        const weightA = patternWeights[a.pattern_type] || 99;
        const weightB = patternWeights[b.pattern_type] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return a.slot - b.slot;
      });
  }, [todosLosMapas, rondaActual, isOriginalesView, isQualifiers]);

  // Filtro por patrón, tipo de custom y búsqueda
  const mapasFiltrados = useMemo(() => {
    return mapasRonda.filter((m) => {
      if (isOriginalesView) {
        if (customTypeFilter === 'SONGS' && !m.is_custom_song) return false;
        if (customTypeFilter === 'MAPS' && (!m.is_custom_map || m.is_custom_song)) return false;
      }

      if (!isOriginalesView && onlyCustomFilter) {
        if (!m.is_custom_map && !m.is_custom_song) return false;
      }

      const pattern = getMapPattern(m);
      const matchesPattern = patternFilter === 'ALL' || pattern === patternFilter;
      if (!matchesPattern) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.title?.toLowerCase().includes(q) ||
        m.artist?.toLowerCase().includes(q) ||
        m.mapper?.toLowerCase().includes(q) ||
        m.difficulty_name?.toLowerCase().includes(q) ||
        m.stages?.name?.toLowerCase().includes(q) ||
        pattern.toLowerCase().includes(q) ||
        `stage ${m.slot}`.toLowerCase().includes(q) ||
        `${pattern}${m.slot}`.toLowerCase().includes(q)
      );
    });
  }, [mapasRonda, isOriginalesView, customTypeFilter, onlyCustomFilter, patternFilter, searchQuery]);

  // Métricas del pool actual
  const poolSummary = useMemo(() => {
    if (mapasRonda.length === 0) {
      return { totalMaps: 0, minSr: 0, maxSr: 0, avgBpm: 0, totalLength: 0 };
    }
    const total = mapasRonda.length;
    const srs = mapasRonda.map((m) => m.sr || 0);
    const minSr = Math.min(...srs);
    const maxSr = Math.max(...srs);
    const totalBpm = mapasRonda.reduce((acc, m) => acc + (m.bpm || 0), 0);
    const totalLength = mapasRonda.reduce((acc, m) => acc + (m.length || 0), 0);

    return {
      totalMaps: total,
      minSr: Number(minSr.toFixed(2)),
      maxSr: Number(maxSr.toFixed(2)),
      avgBpm: Math.round(totalBpm / total),
      totalLength,
    };
  }, [mapasRonda]);

  if (loading) {
    return <LoadingScreen message="CARGANDO POOL..." />;
  }

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-20 select-none animate-fadeIn">
      {/* IMAGEN FLOTANTE DEL EASTER EGG */}
      {showEgg && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center animate-bounce">
          <img
            src="https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/starsky.png"
            className="w-64 h-64 drop-shadow-[0_0_30px_#fdc15a]"
            alt="Easter Egg"
          />
        </div>
      )}

      {/* TITULO CON EASTER EGG */}
      <div className="text-center pt-8 sm:pt-14 mb-6 sm:mb-8 px-4">
        <h1 className="font-['ITCMachine'] text-4xl sm:text-6xl md:text-[90px] uppercase tracking-tighter leading-none inline-block drop-shadow-lg">
          <span onClick={() => handleEgg('M')} className="cursor-default hover:text-[#fdc15a] transition-colors">
            M
          </span>
          <span className="cursor-default">A</span>
          <span onClick={() => handleEgg('P1')} className="cursor-default hover:text-[#fdc15a] transition-colors">
            P
          </span>
          <span onClick={() => handleEgg('P2')} className="cursor-default hover:text-[#fdc15a] transition-colors">
            P
          </span>
          <span className="cursor-default">O</span>
          <span className="cursor-default">O</span>
          <span onClick={() => handleEgg('L')} className="cursor-default hover:text-[#fdc15a] transition-colors">
            L
          </span>
        </h1>
        <p className="text-zinc-400 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">
          Mappools oficiales por ronda del torneo
        </p>
      </div>

      {/* SELECTOR DE RONDAS (ESTILO DARK UNIFICADO) */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-4 max-w-5xl mx-auto">
        {rondas.map((ronda) => {
          const isSelected = rondaActual === ronda.name;
          return (
            <button
              key={ronda.id}
              onClick={() => {
                setRondaActual(ronda.name);
                setPatternFilter('ALL');
                setOnlyCustomFilter(false);
                setCustomTypeFilter('ALL');
                handleEgg(ronda.name);
              }}
              className={`font-['ITCMachine'] text-sm sm:text-lg px-4 sm:px-7 py-2 sm:py-2.5 rounded-lg transition-all tracking-wider ${
                isSelected
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_20px_rgba(253,193,90,0.3)] scale-105 font-normal'
                  : 'bg-black/40 text-zinc-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {ronda.name}
            </button>
          );
        })}

        {/* BOTÓN ORIGINALS DEL TORNEO */}
        <button
          onClick={() => {
            setRondaActual('ORIGINALES');
            setPatternFilter('ALL');
            setOnlyCustomFilter(false);
            setCustomTypeFilter('ALL');
          }}
          className={`font-['ITCMachine'] text-sm sm:text-lg px-4 sm:px-7 py-2 sm:py-2.5 rounded-lg transition-all tracking-wider flex items-center gap-2 ${
            isOriginalesView
              ? 'bg-[#fdc15a] text-black shadow-[0_0_25px_rgba(253,193,90,0.5)] scale-105 font-normal'
              : 'bg-[#fdc15a]/10 text-[#fdc15a] hover:bg-[#fdc15a]/20 border border-[#fdc15a]/30 hover:border-[#fdc15a]/60 shadow-[0_0_15px_rgba(253,193,90,0.15)]'
          }`}
          title="Ver todos los mapas custom y canciones originales del torneo"
        >
          <span>ORIGINALES DEL TORNEO</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-sans font-bold tracking-normal leading-none ${
              isOriginalesView ? 'bg-black/20 text-black' : 'bg-[#fdc15a]/20 text-[#fdc15a]'
            }`}
          >
            {totalOriginales}
          </span>
        </button>
      </div>

      {/* BARRA DE RESUMEN DEL POOL */}
      <div className="max-w-[1240px] mx-auto px-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#1a1a1a] p-3 sm:p-4 rounded-xl border border-white/5 shadow-xl">
          <div className="flex flex-col border-r border-white/5 pr-3 sm:pr-4">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Total Mapas
            </span>
            <span className="font-['ITCMachine'] text-2xl text-white mt-0.5">
              {poolSummary.totalMaps}
            </span>
            <span className="text-[10px] text-zinc-500">
              {isOriginalesView ? 'Originales del Torneo' : `En ${rondaActual}`}
            </span>
          </div>

          <div className="flex flex-col sm:border-r border-white/5 sm:pr-4 pl-1 sm:pl-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Dificultad (SR)
            </span>
            <span className="font-['ITCMachine'] text-2xl text-[#fdc15a] mt-0.5">
              {poolSummary.minSr}★ - {poolSummary.maxSr}★
            </span>
            <span className="text-[10px] text-zinc-500">Rango de estrellas</span>
          </div>

          <div className="flex flex-col border-r border-white/5 pr-3 sm:pr-4 pt-3 sm:pt-0 border-t sm:border-t-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              BPM Promedio
            </span>
            <span className="font-['ITCMachine'] text-2xl text-[#67a4da] mt-0.5">
              {poolSummary.avgBpm}
            </span>
            <span className="text-[10px] text-zinc-500">Ritmo medio</span>
          </div>

          <div className="flex flex-col pl-1 sm:pl-0 pt-3 sm:pt-0 border-t sm:border-t-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Duración Total
            </span>
            <span className="font-['ITCMachine'] text-2xl text-white mt-0.5">
              {Math.floor(poolSummary.totalLength / 60)}:
              {(poolSummary.totalLength % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] text-zinc-500">Tiempo de juego</span>
          </div>
        </div>
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="max-w-[1240px] mx-auto px-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Controles según vista */}
        {isOriginalesView ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCustomTypeFilter('ALL')}
              className={`text-[11px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded transition-all ${
                customTypeFilter === 'ALL'
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                  : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              TODOS ({totalOriginales})
            </button>
            <button
              onClick={() => setCustomTypeFilter('SONGS')}
              className={`text-[11px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded transition-all flex items-center gap-1.5 ${
                customTypeFilter === 'SONGS'
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                  : 'bg-[#1a1a1a] text-[#fdc15a] hover:bg-[#fdc15a]/10 border border-[#fdc15a]/30'
              }`}
            >
              <span>ORIGINAL SONGS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30">
                {totalSongs}
              </span>
            </button>
            <button
              onClick={() => setCustomTypeFilter('MAPS')}
              className={`text-[11px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded transition-all flex items-center gap-1.5 ${
                customTypeFilter === 'MAPS'
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                  : 'bg-[#1a1a1a] text-zinc-300 hover:text-white border border-white/5'
              }`}
            >
              <span>CUSTOM MAPS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10">
                {totalMaps}
              </span>
            </button>

            {/* Separador */}
            <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Filtros por patrón en la vista de originales */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'RC', 'HB', 'LN', 'SV', 'TB'].map((pat) => (
                <button
                  key={pat}
                  onClick={() => setPatternFilter(pat)}
                  className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded transition-all ${
                    patternFilter === pat
                      ? 'bg-white text-black font-black'
                      : 'bg-[#141414] text-zinc-500 hover:text-zinc-300 border border-white/5'
                  }`}
                >
                  {pat === 'ALL' ? 'PATRONES' : pat}
                </button>
              ))}
            </div>
          </div>
        ) : !isQualifiers ? (
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'RC', 'HB', 'LN', 'SV', 'TB'].map((pat) => (
              <button
                key={pat}
                onClick={() => setPatternFilter(pat)}
                className={`text-[11px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded transition-all ${
                  patternFilter === pat
                    ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                    : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {pat === 'ALL' ? 'TODOS' : pat}
              </button>
            ))}

            {/* Toggle rápido de Solo Originals para la ronda actual */}
            <button
              onClick={() => setOnlyCustomFilter(!onlyCustomFilter)}
              className={`text-[11px] font-black uppercase tracking-[0.15em] px-3.5 py-2 rounded transition-all flex items-center gap-1.5 ${
                onlyCustomFilter
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                  : 'bg-[#1a1a1a] text-[#fdc15a] hover:bg-[#fdc15a]/10 border border-[#fdc15a]/30'
              }`}
              title="Filtrar solo mapas custom y canciones originales de esta ronda"
            >
              <span>ORIGINALES</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'RC', 'HB', 'LN', 'SV'].map((pat) => (
              <button
                key={pat}
                onClick={() => setPatternFilter(pat)}
                className={`text-[11px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded transition-all ${
                  patternFilter === pat
                    ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                    : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/5'
                }`}
                title={
                  pat === 'RC'
                    ? 'Rice (Stages 2, 7, 8)'
                    : pat === 'HB'
                    ? 'Hybrid (Stages 3, 6)'
                    : pat === 'LN'
                    ? 'Long Notes (Stages 4, 5)'
                    : pat === 'SV'
                    ? 'Speed Velocity (Stage 1)'
                    : 'Todos los stages'
                }
              >
                {pat === 'ALL' ? 'TODOS' : pat}
              </button>
            ))}

            {/* Toggle rápido de Solo Originals para Qualifiers */}
            <button
              onClick={() => setOnlyCustomFilter(!onlyCustomFilter)}
              className={`text-[11px] font-black uppercase tracking-[0.15em] px-3.5 py-2 rounded transition-all flex items-center gap-1.5 ${
                onlyCustomFilter
                  ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                  : 'bg-[#1a1a1a] text-[#fdc15a] hover:bg-[#fdc15a]/10 border border-[#fdc15a]/30'
              }`}
              title="Filtrar solo mapas custom de Qualifiers"
            >
              <span>ORIGINALES</span>
            </button>
          </div>
        )}

        {/* Buscador de mapas con SVG */}
        <div className="w-full sm:w-72 relative">
          <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por título, artista o mapper..."
            className="w-full bg-[#1a1a1a] border border-white/10 rounded pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#fdc15a] transition-colors"
          />
        </div>
      </div>

      {/* TABLA DE MAPAS RESPONSIVE CON HORIZONTAL SCROLL */}
      <div className="w-full max-w-[1240px] mx-auto px-4">
        {/* Indicador de swipe horizontal en pantallas táctiles */}
        <div className="flex md:hidden items-center justify-between text-zinc-400 text-[10px] tracking-wider uppercase font-bold px-1 mb-2">
          <span>Desliza para ver stats completas</span>
          <span className="text-[#fdc15a] font-mono">↔</span>
        </div>

        <div className="overflow-x-auto pb-4 pt-1 px-1.5 custom-scrollbar">
          <div className="min-w-[1050px] flex flex-col gap-1 font-sans shadow-2xl">
            {/* CABECERA */}
            <div className="flex h-[35px] w-full items-stretch overflow-hidden mb-1 px-0 opacity-90 cursor-default rounded-t">
              <div className="w-[95px] bg-[#fdc15a] flex items-center justify-center text-[#2e2e2e] font-black text-[14px] uppercase tracking-tighter flex-shrink-0 sticky left-0 z-30 shadow-[2px_0_10px_rgba(0,0,0,0.4)]">
                {isOriginalesView ? 'RONDA' : isQualifiers ? 'STAGE' : 'SLOT'}
              </div>
              <div className="w-[15px] bg-[#fdc15a] flex-shrink-0"></div>
              <div className="flex-grow bg-[#fdc15a] flex items-center px-8 border-l border-black/10">
                <span className="font-black text-[14px] uppercase text-[#2e2e2e] tracking-widest">
                  ARTIST | TITLE - DIFFICULTY
                </span>
              </div>
              <div className="flex flex-shrink-0 text-[#2e2e2e] font-black text-[14px]">
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">
                  BPM
                </div>
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">
                  SR
                </div>
                <div className="w-[70px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">
                  LENGTH
                </div>
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">
                  COMBO
                </div>
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">
                  OD
                </div>
                <div className="w-[130px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">
                  MAPPER
                </div>
                <div className="w-[120px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10 rounded-tr-sm">
                  MAP ID
                </div>
              </div>
            </div>

            {/* FILAS DE MAPAS */}
            {mapasFiltrados.length === 0 ? (
              <div className="text-center py-16 bg-[#1a1a1a] rounded border border-dashed border-white/5">
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">
                  {searchQuery
                    ? `No se encontraron mapas para "${searchQuery}"`
                    : 'No hay mapas disponibles en esta sección'}
                </p>
              </div>
            ) : (
              mapasFiltrados.map((mapa) => {
                const isElite = mapa.is_custom_map && mapa.is_custom_song;
                const isCustom = mapa.is_custom_map && !mapa.is_custom_song;
                const isSpecial = isElite || isCustom || isQualifiers;
                const mapPattern = getMapPattern(mapa);
                const patternColor = getPatternColor(mapPattern);

                return (
                  <div
                    key={mapa.id}
                    className={`flex h-[75px] w-full items-stretch overflow-hidden group transition-all duration-300 rounded ${
                      isElite
                        ? 'border-2 border-[#fdc15a] shadow-[0_0_30px_rgba(253,193,90,0.4)] z-20 my-1 bg-gradient-to-r from-[#fdc15a]/10 to-transparent'
                        : isCustom
                        ? 'border border-[#fdc15a]/70 shadow-[0_0_15px_rgba(253,193,90,0.2)] z-10 my-0.5'
                        : 'border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Indicador de Slot / Stage (Sticky en horizontal scroll para fácil orientación) */}
                    <div
                      className={`w-[95px] flex flex-col items-center justify-center font-bold flex-shrink-0 cursor-default transition-colors sticky left-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.5)] ${
                        isSpecial
                          ? 'bg-[#141414] border-l-4 border-[#fdc15a]'
                          : 'bg-[#1e1e1e] text-zinc-200 border-l-2 border-white/10 group-hover:bg-[#252525]'
                      }`}
                    >
                      {isOriginalesView ? (
                        <div className="flex flex-col items-center leading-none text-center px-1">
                          <span className="text-[9px] uppercase font-bold text-zinc-400 truncate max-w-[85px]">
                            {mapa.stages?.name?.replace('ROUND OF ', 'RO').replace('QUARTERFINALS', 'QF').replace('SEMIFINALS', 'SF').replace('GRAND FINALS', 'GF') || 'STAGE'}
                          </span>
                          <span className="text-[18px] font-['ITCMachine'] text-[#fdc15a] mt-0.5">
                            {mapa.stages?.name?.toUpperCase().includes('QUALIFIER') ? `S${mapa.slot} ${mapPattern}` : `${mapa.pattern_type}${mapa.slot}`}
                          </span>
                        </div>
                      ) : isQualifiers ? (
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-[10px] uppercase font-black text-zinc-400">STAGE</span>
                          <span className="text-[22px] font-['ITCMachine'] text-[#fdc15a] leading-tight">{mapa.slot}</span>
                          <span
                            className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5"
                            style={{ backgroundColor: `${patternColor}25`, color: patternColor }}
                          >
                            {mapPattern}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[20px] font-['ITCMachine'] tracking-tight text-white">
                          {mapa.pattern_type}
                          <span style={{ color: patternColor }}>{mapa.slot}</span>
                        </span>
                      )}
                    </div>

                    {/* Barra de color de patrón */}
                    <div
                      className={`w-[15px] flex items-center justify-center flex-shrink-0 relative border-l border-black/10 ${
                        isSpecial ? 'bg-[#fdc15a]/20' : 'bg-black/40'
                      }`}
                    >
                      <div
                        className="w-[6px] h-[45px] rounded-full"
                        style={{ backgroundColor: patternColor }}
                      ></div>
                    </div>

                    {/* Banner central interactivo */}
                    <a
                      href={`https://osu.ppy.sh/b/${mapa.beatmap_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow relative bg-[#1a1a1a] flex items-center px-8 min-w-0 border-l border-white/5 overflow-hidden justify-between group/banner"
                      title="Abrir mapa en osu.ppy.sh"
                    >
                      <img
                        src={
                          mapa.is_custom_song
                            ? `/bgs/${mapa.banner_id}.jpg`
                            : `https://assets.ppy.sh/beatmaps/${mapa.banner_id}/covers/cover.jpg`
                        }
                        className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover/banner:scale-105"
                        alt=""
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (mapa.is_custom_song && !target.src.includes('ppy.sh')) {
                            target.src = `https://assets.ppy.sh/beatmaps/${mapa.banner_id}/covers/cover.jpg`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent"></div>

                      <div className="relative z-10 flex items-center min-w-0 flex-grow">
                        {/* Audio preview SOLO para custom songs (único y exclusivo) */}
                        {mapa.is_custom_song && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePlay(mapa.banner_id);
                            }}
                            className={`relative z-30 mr-5 w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              playingId === mapa.banner_id
                                ? 'bg-white text-black border-white shadow-[0_0_15px_white]'
                                : 'bg-black/50 text-[#fdc15a] border-[#fdc15a] hover:bg-[#fdc15a] hover:text-black shadow-[0_0_10px_rgba(253,193,90,0.3)]'
                            }`}
                            title="Reproducir canción original del torneo"
                          >
                            {playingId === mapa.banner_id ? (
                              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                          </button>
                        )}

                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-bold text-[17px] truncate ${
                                mapa.is_custom_song
                                  ? 'text-[#fdc15a] drop-shadow-[0_0_10px_rgba(253,193,90,0.35)]'
                                  : 'text-white drop-shadow-lg'
                              }`}
                            >
                              {mapa.title}
                            </span>
                            {isElite && (
                              <span className="bg-[#fdc15a] text-black text-[10px] px-2.5 py-0.5 rounded font-black animate-pulse shadow-md flex-shrink-0">
                                ORIGINAL SONG
                              </span>
                            )}
                            {isCustom && (
                              <span className="border border-[#fdc15a] text-[#fdc15a] text-[10px] px-2 py-0.5 rounded font-black flex-shrink-0">
                                CUSTOM MAP
                              </span>
                            )}
                          </div>
                          <span
                            className={`block text-[12px] font-normal uppercase tracking-widest truncate ${
                              isSpecial ? 'text-[#fdc15a]' : 'text-zinc-400'
                            }`}
                          >
                            {mapa.artist} // {mapa.difficulty_name}
                          </span>
                        </div>
                      </div>

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

                    {/* Especificaciones técnicas */}
                    <div className="flex flex-shrink-0 text-white font-mono font-bold text-[13px] cursor-default">
                      <div className="w-[60px] bg-[#222222] flex items-center justify-center border-r border-white/5">
                        {mapa.bpm}
                      </div>
                      <div className="w-[60px] bg-[#2a2a2a] flex items-center justify-center gap-1 border-r border-white/5 text-[#fdc15a]">
                        <span>{mapa.sr.toFixed(2)}</span>
                        <svg className="w-3 h-3 fill-current inline-block shrink-0" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </div>
                      <div className="w-[70px] bg-[#222222] flex items-center justify-center border-r border-white/5">
                        {Math.floor(mapa.length / 60)}:
                        {(mapa.length % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="w-[60px] bg-[#2a2a2a] flex items-center justify-center border-r border-white/5 text-zinc-300">
                        {mapa.combo}x
                      </div>
                      <div className="w-[60px] bg-[#222222] flex items-center justify-center border-r border-white/5">
                        {mapa.od}
                      </div>

                      {/* Mapper con avatar */}
                      <a
                        href={
                          mapa.mapper_id
                            ? `https://osu.ppy.sh/users/${mapa.mapper_id}`
                            : `https://osu.ppy.sh/users/${encodeURIComponent(mapa.mapper)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-[130px] bg-[#2a2a2a] relative flex items-center justify-center px-2 overflow-hidden group/mapper transition-all border-r border-white/5"
                        title="Ver perfil del mapper"
                      >
                        {mapa.mapper_id && (
                          <>
                            <img
                              src={`https://a.ppy.sh/${mapa.mapper_id}`}
                              className="absolute inset-0 w-full h-full object-cover blur-[1px] opacity-30 grayscale group-hover/mapper:grayscale-0 group-hover/mapper:opacity-75 transition-all duration-500"
                              alt=""
                            />
                            <div className="absolute inset-0 bg-black/60 group-hover/mapper:bg-black/30 transition-colors"></div>
                          </>
                        )}
                        <span className="relative z-10 truncate text-[12px] font-sans font-normal uppercase text-zinc-300 group-hover/mapper:text-[#fdc15a] transition-colors drop-shadow-md">
                          {mapa.mapper}
                        </span>
                      </a>

                      {/* Botón Copiar ID y !mp */}
                      <div className="w-[120px] bg-[#222222] flex items-stretch">
                        {/* Copiar ID */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(mapa.beatmap_id.toString(), 'id');
                          }}
                          className={`flex-grow flex items-center justify-center transition-all relative overflow-hidden font-black ${
                            isElite || isQualifiers
                              ? 'bg-[#fdc15a] text-black hover:bg-white'
                              : 'bg-black/40 text-[#fdc15a] hover:bg-white hover:text-black'
                          }`}
                          title="Copiar Beatmap ID"
                        >
                          <span
                            className={`text-[12px] transition-all duration-200 ${
                              copiedId === mapa.beatmap_id.toString() && copiedType === 'id'
                                ? 'opacity-0 scale-50'
                                : 'opacity-100'
                            }`}
                          >
                            {mapa.beatmap_id}
                          </span>
                          <div
                            className={`absolute inset-0 flex items-center justify-center text-[10px] uppercase font-sans font-black transition-all duration-200 ${
                              copiedId === mapa.beatmap_id.toString() && copiedType === 'id'
                                ? 'top-0 opacity-100'
                                : 'top-full opacity-0'
                            }`}
                          >
                            ¡ID!
                          </div>
                        </button>

                        {/* Botón !mp command */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(mapa.beatmap_id.toString(), 'mp');
                          }}
                          className="w-[36px] bg-black/70 hover:bg-[#fdc15a] hover:text-black text-zinc-400 text-[10px] font-mono font-bold flex items-center justify-center border-l border-white/5 transition-colors relative overflow-hidden"
                          title="Copiar comando '!mp map <id>'"
                        >
                          <span
                            className={`transition-all duration-200 ${
                              copiedId === mapa.beatmap_id.toString() && copiedType === 'mp'
                                ? 'opacity-0 scale-50'
                                : 'opacity-100'
                            }`}
                          >
                            !mp
                          </span>
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                              copiedId === mapa.beatmap_id.toString() && copiedType === 'mp'
                                ? 'top-0 opacity-100 bg-[#fdc15a] text-black'
                                : 'top-full opacity-0'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 stroke-black stroke-[3] fill-none" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}