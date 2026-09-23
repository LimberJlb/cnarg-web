'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CustomSong {
  id: number;
  banner_id: string;
  beatmap_id: number;
  title: string;
  artist: string;
  mapper: string;
  stage_name: string;
  stage_short: string;
  pattern_type: string;
  slot: number;
  soundcloud_url?: string;        // Perfil o página del artista en SoundCloud
  soundcloud_track_url?: string;  // Track específico para incrustar el reproductor iframe de SoundCloud
  audio_url?: string;             // Enlace directo a audio en alta calidad (ej. Supabase o local)
}

const CUSTOM_SONGS: CustomSong[] = [
  {
    id: 1,
    banner_id: '2509844',
    beatmap_id: 5529521,
    title: 'Heavenly',
    artist: 'C3NTELL4',
    mapper: 'oid45',
    stage_name: 'Round of 16',
    stage_short: 'Ro16',
    pattern_type: 'TB',
    slot: 1,
    soundcloud_url: 'https://soundcloud.com/centellaculiao',
  },
  {
    id: 2,
    banner_id: '2514632',
    beatmap_id: 5544579,
    title: 'Psychomachia',
    artist: 'Primbe',
    mapper: 'Alumence',
    stage_name: 'Quarterfinals',
    stage_short: 'QF',
    pattern_type: 'TB',
    slot: 1,
    soundcloud_url: 'https://soundcloud.com/primbe',
    soundcloud_track_url: 'https://soundcloud.com/primbe/psychomachia',
  },
  {
    id: 3,
    banner_id: '2516951',
    beatmap_id: 5551718,
    title: 'Hyperflux Serenity',
    artist: 'Sillot',
    mapper: 'Castella',
    stage_name: 'Semifinals',
    stage_short: 'SF',
    pattern_type: 'TB',
    slot: 1,
    soundcloud_url: 'https://soundcloud.com/manu_gmr-22',
    soundcloud_track_url: 'https://soundcloud.com/manu_gmr-22/hyperflux-serenity-cnarg-4k',
  },
  {
    id: 4,
    banner_id: '2520391',
    beatmap_id: 5562632,
    title: "dj... you're killing my vibe",
    artist: 'flickery',
    mapper: 'Znow',
    stage_name: 'Finals',
    stage_short: 'Finals',
    pattern_type: 'HB',
    slot: 3,
    soundcloud_url: 'https://soundcloud.com/evilestpetshop',
    soundcloud_track_url: 'https://soundcloud.com/evilestpetshop/vibe',
  },
  {
    id: 5,
    banner_id: '2520399',
    beatmap_id: 5562642,
    title: 'Fragment Switcher',
    artist: 'pm04034',
    mapper: '[TCD] Dzar03',
    stage_name: 'Finals',
    stage_short: 'Finals',
    pattern_type: 'TB',
    slot: 1,
    soundcloud_url: 'https://soundcloud.com/pm04034',
  },
  {
    id: 6,
    banner_id: '2524481',
    beatmap_id: 5575387,
    title: 'pohC_ionuG',
    artist: 'pm04034',
    mapper: 'oid45',
    stage_name: 'Grand Finals',
    stage_short: 'GF',
    pattern_type: 'RC',
    slot: 7,
    soundcloud_url: 'https://soundcloud.com/pm04034',
  },
  {
    id: 7,
    banner_id: '2524485',
    beatmap_id: 5575392,
    title: 'Sparkbeat',
    artist: 'Primbe',
    mapper: 'oid45',
    stage_name: 'Grand Finals',
    stage_short: 'GF',
    pattern_type: 'LN',
    slot: 2,
    soundcloud_url: 'https://soundcloud.com/primbe',
    soundcloud_track_url: 'https://soundcloud.com/primbe/sparkbeat',
  },
  {
    id: 8,
    banner_id: '2524472',
    beatmap_id: 5575355,
    title: 'Paradox Seeker',
    artist: 'CNARG Sound Team',
    mapper: 'uL-',
    stage_name: 'Grand Finals',
    stage_short: 'GF',
    pattern_type: 'TB',
    slot: 1,
    soundcloud_url: 'https://soundcloud.com/amaristia',
    soundcloud_track_url: 'https://soundcloud.com/amaristia/paradox-seeker',
  },
];

interface SchedulePhase {
  step: string;
  title: string;
  subtitle: string;
  dates: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  mappoolLink?: string;
}

const CRONOGRAMA_STAGES: SchedulePhase[] = [
  {
    step: '01',
    title: 'Inscripciones',
    subtitle: 'Player Registrations',
    dates: '18/01/26 - 30/01/26',
    status: 'completed',
  },
  {
    step: '02',
    title: 'Fase de Screening',
    subtitle: 'Screening Phase',
    dates: '31/01/26 - 07/02/26',
    status: 'completed',
  },
  {
    step: '03',
    title: 'Qualifiers Showcase',
    subtitle: 'Presentación del Mappool',
    dates: '08/02/26',
    status: 'completed',
    mappoolLink: '/mappool',
  },
  {
    step: '04',
    title: 'Qualifiers',
    subtitle: 'Clasificatorias Oficiales',
    dates: '14/02/26 - 15/02/26',
    status: 'completed',
    mappoolLink: '/mappool',
  },
  {
    step: '05',
    title: 'Round of 16',
    subtitle: 'Octavos de Final',
    dates: '21/02/26 - 22/02/26',
    status: 'completed',
    mappoolLink: '/mappool',
  },
  {
    step: '06',
    title: 'Quarterfinals',
    subtitle: 'Cuartos de Final',
    dates: '28/02/26 - 01/03/26',
    status: 'completed',
    mappoolLink: '/mappool',
  },
  {
    step: '07',
    title: 'Semifinals',
    subtitle: 'Semifinales',
    dates: '07/03/26 - 08/03/26',
    status: 'completed',
    mappoolLink: '/mappool',
  },
  {
    step: '08',
    title: 'Finals',
    subtitle: 'Finales de Cuadro',
    dates: '14/03/26 - 15/03/26',
    status: 'completed',
    mappoolLink: '/mappool',
  },
  {
    step: '09',
    title: 'Grand Finals',
    subtitle: 'Gran Final del Torneo',
    dates: '21/03/26 - 22/03/26',
    status: 'completed',
    mappoolLink: '/mappool',
  },
];

export default function Home() {
  const [songIndex, setSongIndex] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.2);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Seleccionar canción aleatoria y precargar todas las imágenes locales en caché del navegador
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CUSTOM_SONGS.length);
    setSongIndex(randomIndex);

    // Precargar inmediatamente las imágenes de fondo locales para evitar parpadeos
    CUSTOM_SONGS.forEach((song) => {
      const img = new Image();
      img.src = `/bgs/${song.banner_id}.jpg`;
    });

    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const currentSong = CUSTOM_SONGS[songIndex] || CUSTOM_SONGS[0];
  const audioSrc = currentSong.audio_url || `https://b.ppy.sh/preview/${currentSong.banner_id}.mp3`;

  // Actualizar volumen del audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Manejo de cambio de canción con transición fluida directa
  const changeSong = (newIndex: number, autoPlay: boolean = true) => {
    setSongIndex(newIndex);
    setCurrentTime(0);
    const nextSong = CUSTOM_SONGS[newIndex];
    if (audioRef.current) {
      if (nextSong.soundcloud_track_url) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = nextSong.audio_url || `https://b.ppy.sh/preview/${nextSong.banner_id}.mp3`;
        audioRef.current.load();
        if (autoPlay) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            setIsPlaying(false);
          });
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

  const handleNextSong = () => {
    if (isShuffle) {
      let nextIndex = Math.floor(Math.random() * CUSTOM_SONGS.length);
      if (nextIndex === songIndex) {
        nextIndex = (songIndex + 1) % CUSTOM_SONGS.length;
      }
      changeSong(nextIndex, isPlaying);
    } else {
      const nextIndex = (songIndex + 1) % CUSTOM_SONGS.length;
      changeSong(nextIndex, isPlaying);
    }
  };

  const handlePrevSong = () => {
    const prevIndex = (songIndex - 1 + CUSTOM_SONGS.length) % CUSTOM_SONGS.length;
    changeSong(prevIndex, isPlaying);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-full bg-[#2e2e2e] text-white font-sans overflow-x-hidden flex flex-col">
      {/* Audio oculto */}
      <audio
        ref={audioRef}
        src={isMounted ? audioSrc : undefined}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          handleNextSong();
        }}
        onError={() => {
          setIsPlaying(false);
        }}
      />

      {/* CONTENEDOR HERO: Fondo completo centrado con gradiente cinemático */}
      <div className="relative flex flex-col lg:flex-row w-full lg:min-h-[calc(100vh-80px-48px)]">
        
        {/* FONDO DE CANCIÓN CUSTOM COMPLETO Y CENTRADO */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Capa base oscura */}
          <div className="absolute inset-0 bg-[#181818]" />

          {/* Imágenes de fondo locales con crossfade cinematográfico continuo (sin parpadeos) */}
          {CUSTOM_SONGS.map((song, idx) => {
            const isActive = isMounted && idx === songIndex;
            return (
              <img
                key={song.banner_id}
                src={`/bgs/${song.banner_id}.jpg`}
                alt={song.title}
                loading="eager"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-in-out pointer-events-none ${
                  isActive ? 'opacity-70 lg:opacity-75' : 'opacity-0'
                }`}
              />
            );
          })}
          
          {/* Gradientes cinematográficos:
              - En escritorio: Más denso a la izquierda para máxima legibilidad del texto, abriéndose hacia el centro y derecha
              - En móvil: Suave de arriba a abajo para máxima legibilidad del texto y reproductor
          */}
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-[#1c1c1c]/95 via-[#1c1c1c]/80 lg:via-[#1c1c1c]/45 to-[#1c1c1c]/95 lg:to-black/25 pointer-events-none" />
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>

        {/* LADO IZQUIERDO (EN MÓVIL: SUPERIOR): Información, Título y Botón a Awards */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-16 xl:px-24 pt-8 pb-4 sm:py-10 lg:py-0 relative z-10 lg:-translate-y-6">
          
          {/* Título Principal con tipografía fluida y colores oficiales */}
          <h2 className="font-['ITCMachine'] uppercase leading-[0.85] tracking-tight text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-[90px] xl:text-[115px] 2xl:text-[130px] drop-shadow-md">
            <span className="text-[#67a4da]">COPA</span><br />
            <span className="text-white">NACIONAL</span><br />
            <span className="text-[#67a4da]">ARGENTINA</span>
          </h2>

          {/* Descripción y Hosts con enlaces a perfiles de osu! */}
          <p className="mt-4 sm:mt-5 text-zinc-200 font-['TrebuchetMS'] max-w-md text-sm sm:text-lg lg:text-[19px] leading-relaxed drop-shadow-sm">
            Un torneo argentino de osu!mania 4K.<br />
            <span className="text-zinc-300">
              Hosteado por{' '}
              <a
                href="https://osu.ppy.sh/users/7093698"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#fdc15a] hover:text-[#ffd68a] font-bold underline decoration-[#fdc15a]/40 hover:decoration-[#fdc15a] transition-all"
                title="Perfil de osu! de Limber"
              >
                Limber
              </a>{' '}
              y{' '}
              <a
                href="https://osu.ppy.sh/users/18566390"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#fdc15a] hover:text-[#ffd68a] font-bold underline decoration-[#fdc15a]/40 hover:decoration-[#fdc15a] transition-all"
                title="Perfil de osu! de Nubbo"
              >
                Nubbo
              </a>
            </span>
          </p>

          {/* BOTONES INTERACTIVOS: AWARDS Y REGLAS */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/awards"
              className="group inline-flex items-center justify-center gap-3.5 px-6 sm:px-8 py-3.5 sm:py-4 bg-[#fdc15a]/15 hover:bg-[#fdc15a]/25 text-[#fdc15a] border-2 border-[#fdc15a] font-['ITCMachine'] text-base sm:text-xl tracking-wider rounded-xl shadow-[0_0_25px_rgba(253,193,90,0.35)] hover:shadow-[0_0_35px_rgba(253,193,90,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 text-center"
            >
              <span className="font-bold text-[#fdc15a]">AWARDS</span>
              <span className="text-xl sm:text-2xl leading-none text-[#fdc15a] transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </Link>
            <a
              href="https://docs.google.com/document/d/15JRIQAPH3ByOVW3UDh7uKMb1NpKrkzbaGeQ4alD5bLY/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white font-['ITCMachine'] text-base sm:text-xl tracking-wider rounded-xl border border-white/10 hover:border-[#fdc15a]/40 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm text-center"
              title="Ver reglamento oficial completo"
            >
              <span>REGLAS COMPLETAS</span>
              <span className="text-lg sm:text-xl leading-none text-[#fdc15a] transition-transform duration-300 group-hover:translate-x-1">
                ↗
              </span>
            </a>
          </div>
        </div>

        {/* LADO DERECHO (EN MÓVIL: INFERIOR): Espacio visual y Reproductor OST */}
        <div className="w-full lg:w-1/2 relative flex flex-col justify-start lg:justify-end z-10">
          {/* REPRODUCTOR FLOTANTE OST (Glassmorphic) con fade suave inicial */}
          <div className={`relative z-30 px-4 sm:px-6 lg:px-8 pt-2 pb-12 sm:pb-14 lg:pb-8 flex justify-center lg:justify-end transition-opacity duration-700 ease-out ${
            isMounted ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="w-full max-w-md bg-[#181818]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] text-white">
              
              {/* Barra superior del reproductor: Badge y botón lista */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#fdc15a]/15 text-[#fdc15a] border border-[#fdc15a]/30">
                    OST ORIGINAL
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {songIndex + 1} / {CUSTOM_SONGS.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    showPlaylist
                      ? 'bg-[#fdc15a] text-[#1a1a1a] font-bold shadow-[0_0_12px_rgba(253,193,90,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10'
                  }`}
                  title="Ver lista de canciones originales"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                  <span>LISTA</span>
                </button>
              </div>

              {/* Información de la canción actual */}
              <div className="mb-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-['TrebuchetMS'] font-bold text-base sm:text-lg text-white truncate drop-shadow-sm">
                    {currentSong.title}
                  </h3>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-zinc-200 border border-white/10">
                    {currentSong.pattern_type}{currentSong.slot} • {currentSong.stage_short}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-xs text-zinc-300 truncate font-['TrebuchetMS']">
                    {currentSong.artist} <span className="text-zinc-500">• Map: {currentSong.mapper}</span>
                  </p>

                  {/* Enlace al SoundCloud del artista si está configurado */}
                  {currentSong.soundcloud_url && (
                    <a
                      href={currentSong.soundcloud_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff5500]/15 hover:bg-[#ff5500]/30 text-[#ff7733] border border-[#ff5500]/40 transition-all hover:scale-105"
                      title={`Ver perfil de ${currentSong.artist} en SoundCloud`}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                      </svg>
                      <span>SOUNDCLOUD</span>
                    </a>
                  )}
                </div>
              </div>

              {/* CONTENIDO DEL REPRODUCTOR */}
              {currentSong.soundcloud_track_url ? (
                /* MODO SOUNDCLOUD WIDGET: Visible y oficial para sumar reproducciones legítimas al artista */
                <div className="space-y-3">
                  <div className="w-full h-[120px] rounded-xl overflow-hidden border border-white/10 bg-black/50 shadow-inner">
                    <iframe
                      key={currentSong.soundcloud_track_url}
                      width="100%"
                      height="120"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                        currentSong.soundcloud_track_url
                      )}&color=%23fdc15a&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Segmento interactivo con botón directo a su SoundCloud */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/10">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Apoyá al artista:
                    </span>
                    <a
                      href={currentSong.soundcloud_track_url || currentSong.soundcloud_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#ff5500]/15 hover:bg-[#ff5500]/25 text-[#ff7733] hover:text-[#ffa066] border border-[#ff5500]/40 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,85,0,0.15)]"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                      </svg>
                      <span>Escuchalo en SoundCloud</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* MODO PREVIEW / AUDIO NATIVO: Mantiene el mismo formato y dimensiones */
                <div className="space-y-3">
                  <div className="w-full h-[120px] rounded-xl border border-white/10 bg-black/50 p-3.5 flex flex-col justify-between shadow-inner">
                    {/* Barra de Progreso */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                        <span>{formatTime(currentTime)}</span>
                        <span className="text-zinc-500 uppercase tracking-wider text-[9px]">Preview de osu!</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="relative flex items-center group">
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          step="0.1"
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#fdc15a] group-hover:h-2 transition-all"
                        />
                      </div>
                    </div>

                    {/* Controles de reproducción con Play/Pausa centrado matemáticamente respecto al cuadro */}
                    <div className="relative flex items-center justify-between min-h-[40px]">
                      {/* Lado izquierdo: Modo aleatorio */}
                      <div className="flex items-center z-10">
                        <button
                          type="button"
                          onClick={() => setIsShuffle(!isShuffle)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isShuffle
                              ? 'text-[#fdc15a] bg-[#fdc15a]/10'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}
                          title={isShuffle ? 'Modo aleatorio activado' : 'Activar modo aleatorio'}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      {/* Centro absoluto: Play / Pausa (100% centrado respecto al cuadro general) */}
                      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="w-10 h-10 rounded-full bg-[#fdc15a] hover:bg-[#ffe28a] text-[#1a1a1a] flex items-center justify-center shadow-[0_0_20px_rgba(253,193,90,0.4)] hover:scale-105 active:scale-95 transition-all"
                          title={isPlaying ? 'Pausar' : 'Reproducir'}
                        >
                          {isPlaying ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Lado derecho: Control de Volumen */}
                      <div className="flex items-center gap-1.5 z-10">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          title={isMuted ? 'Activar sonido' : 'Silenciar'}
                        >
                          {isMuted || volume === 0 ? (
                            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                              <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-14 sm:w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#fdc15a]"
                          title={`Volumen: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Segmento de pie del reproductor nativo con enlace directo al SoundCloud del artista */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/10">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Fuente: Preview osu!
                    </span>
                    {currentSong.soundcloud_url ? (
                      <a
                        href={currentSong.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#ff5500]/15 hover:bg-[#ff5500]/25 text-[#ff7733] hover:text-[#ffa066] border border-[#ff5500]/40 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,85,0,0.15)]"
                        title={`Visitar el perfil de ${currentSong.artist} en SoundCloud`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                        </svg>
                        <span>SoundCloud del artista</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-500">
                        Perfil no disponible
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* CONTROLES UNIFICADOS DE NAVEGACIÓN (IDÉNTICOS EN TODAS LAS CANCIONES) */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/10 text-xs font-mono text-zinc-300">
                <button
                  type="button"
                  onClick={handlePrevSong}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                  title="Canción anterior"
                >
                  <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Anterior</span>
                </button>

                <span className="text-[11px] text-zinc-500 font-mono">
                  {songIndex + 1} de {CUSTOM_SONGS.length}
                </span>

                <button
                  type="button"
                  onClick={handleNextSong}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                  title="Siguiente canción"
                >
                  <span>Siguiente</span>
                  <svg className="w-3.5 h-3.5 stroke-current stroke-2 fill-none group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>

              {/* Lista Desplegable de Canciones (Playlist Drawer) */}
              {showPlaylist && (
                <div className="mt-4 pt-3 border-t border-white/10 max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 animate-fadeIn">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1 mb-1">
                    Canciones Originales ({CUSTOM_SONGS.length})
                  </span>
                  {CUSTOM_SONGS.map((song, idx) => {
                    const isCurrent = idx === songIndex;
                    return (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => {
                          changeSong(idx, true);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                          isCurrent
                            ? 'bg-[#fdc15a]/20 border border-[#fdc15a]/40 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <span className={`w-5 text-center font-mono text-xs shrink-0 ${isCurrent ? 'text-[#fdc15a] font-bold' : 'text-zinc-500'}`}>
                            {isCurrent && isPlaying ? (
                              <span className="inline-block w-2 h-2 rounded-full bg-[#fdc15a] animate-ping" />
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate leading-tight font-['TrebuchetMS']">
                              {song.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate leading-tight font-['TrebuchetMS'] mt-0.5">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Columna fija alineada para el icono de SoundCloud */}
                          <div className="w-6 flex items-center justify-center shrink-0">
                            {song.soundcloud_url ? (
                              <a
                                href={song.soundcloud_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-[#ff5500]/15 hover:bg-[#ff5500]/30 text-[#ff7733] border border-[#ff5500]/30 transition-all hover:scale-110 active:scale-95"
                                title={`SoundCloud de ${song.artist}`}
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                                </svg>
                              </a>
                            ) : (
                              <span className="w-6 h-6" aria-hidden="true" />
                            )}
                          </div>

                          {/* Columna fija alineada para el badge de patrón */}
                          <span className="w-11 text-center font-mono text-[10px] font-bold py-0.5 rounded bg-black/40 text-zinc-300 border border-white/10 shrink-0">
                            {song.pattern_type}{song.slot}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* LOGO CENTRAL 4K: Tamaño regulado armónicamente y centrado óptico */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none z-20 lg:-translate-y-6">
          <div className="relative">
            <img 
              src="/logo-4k.png" 
              alt="Logo 4K" 
              className="w-[18vw] max-w-[300px] xl:max-w-[340px] min-w-[160px] drop-shadow-[0_0_30px_rgba(103,164,218,0.35)] transition-transform duration-700 hover:scale-105" 
            />
          </div>
        </div>

        {/* Logo 4K para Móviles y Tablets (Centrado en la parte superior derecha con opacidad balanceada) */}
        <div className="lg:hidden absolute top-4 sm:top-6 right-4 sm:right-6 pointer-events-none z-20">
          <img 
            src="/logo-4k.png" 
            alt="Logo 4K" 
            className="w-16 sm:w-28 drop-shadow-[0_0_20px_rgba(103,164,218,0.4)] opacity-70 sm:opacity-90" 
          />
        </div>

        {/* Indicador de scroll hacia el Cronograma (Visible solo en desktop donde el centro está despejado) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 hidden lg:flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              document.getElementById('cronograma')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-[#fdc15a] transition-all cursor-pointer group"
            title="Desplazarse al Cronograma Oficial"
          >
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-zinc-400 group-hover:text-[#fdc15a] transition-colors">
              CRONOGRAMA
            </span>
            <svg
              className="w-4 h-4 text-zinc-400 group-hover:text-[#fdc15a] animate-bounce transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

      </div>

      {/* SECCIÓN CRONOGRAMA OFICIAL */}
      <section
        id="cronograma"
        className="relative z-10 w-full bg-[#181818] border-t border-white/10 py-12 sm:py-20 px-4 sm:px-12 md:px-16 lg:px-20 scroll-mt-20"
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Cabecera de la sección */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 sm:pb-8 mb-8 sm:mb-12 border-b border-white/10 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase bg-[#fdc15a]/15 text-[#fdc15a] border border-[#fdc15a]/30">
                  TEMPORADA 2026
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  TORNEO CONCLUIDO
                </span>
              </div>
              <h2 className="font-['ITCMachine'] text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight uppercase">
                CRONOGRAMA <span className="text-[#fdc15a]">OFICIAL</span>
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-['TrebuchetMS'] mt-2 max-w-2xl leading-relaxed">
                Fechas oficiales de desarrollo, fases clasificatorias y rondas eliminatorias de la Copa Nacional Argentina 4K 2026.
              </p>
            </div>

            {/* Accesos directos rápidos */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/mappool"
                className="px-3.5 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-['ITCMachine'] tracking-wider uppercase transition-all hover:scale-105"
              >
                MAPPOOL OFICIAL →
              </Link>
              <a
                href="https://docs.google.com/document/d/15JRIQAPH3ByOVW3UDh7uKMb1NpKrkzbaGeQ4alD5bLY/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 sm:px-4 py-2 rounded-lg bg-[#fdc15a] hover:bg-[#ffe28a] text-black font-['ITCMachine'] text-xs tracking-wider uppercase font-normal transition-all hover:scale-105 shadow-[0_0_15px_rgba(253,193,90,0.3)] flex items-center gap-1"
                title="Ver reglamento oficial completo"
              >
                <span>REGLAS COMPLETAS ↗</span>
              </a>
            </div>
          </div>

          {/* Grilla de Etapas del Cronograma */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CRONOGRAMA_STAGES.map((stage) => {
              const isGrandFinals = stage.step === '09';
              const isQualifiers = stage.step === '04';

              let cardBorder = 'border-white/10 hover:border-white/20';
              let cardBg = 'bg-[#1e1e1e]/80';
              let glow = '';

              if (isGrandFinals) {
                cardBorder = 'border-[#fdc15a]/60 hover:border-[#fdc15a]';
                cardBg = 'bg-gradient-to-br from-[#fdc15a]/10 via-[#1e1e1e] to-[#1e1e1e]';
                glow = 'shadow-[0_0_30px_rgba(253,193,90,0.15)]';
              } else if (isQualifiers) {
                cardBorder = 'border-[#67a4da]/50 hover:border-[#67a4da]';
                cardBg = 'bg-gradient-to-br from-[#67a4da]/10 via-[#1e1e1e] to-[#1e1e1e]';
              }

              return (
                <div
                  key={stage.step}
                  className={`relative rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between ${cardBg} ${cardBorder} ${glow}`}
                >
                  {/* Fila superior: Paso y Estado */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span
                        className={`font-['ITCMachine'] text-2xl tracking-tight ${
                          isGrandFinals ? 'text-[#fdc15a]' : isQualifiers ? 'text-[#67a4da]' : 'text-zinc-500'
                        }`}
                      >
                        {stage.step}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Finalizado
                      </span>
                    </div>

                    {/* Título de la etapa */}
                    <h3 className="font-['ITCMachine'] text-2xl text-white tracking-wide uppercase">
                      {stage.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-['TrebuchetMS'] mt-0.5">
                      {stage.subtitle}
                    </p>
                  </div>

                  {/* Fila inferior: Fecha y Acceso */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#fdc15a]">
                      <svg className="w-4 h-4 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                      </svg>
                      <span className="font-bold tracking-wide">{stage.dates}</span>
                    </div>

                    {/* Botón de navegación a Mappool si corresponde */}
                    {stage.mappoolLink && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={stage.mappoolLink}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] font-mono font-bold text-zinc-300 hover:text-white border border-white/10 transition-colors"
                          title="Ver mappool de esta etapa"
                        >
                          Mappool ↗
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}