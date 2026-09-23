import React from 'react';
import Link from 'next/link';
import { TournamentPlacement } from '../lib/tournamentPlacements';

export interface PlayerCardProps {
  nombre: string;
  osu_id: string | number;
  rank: number | string;
  seed: number | string;
  avatar?: string | null;
  teamLogo?: string | null;
  teamName?: string;
  placement?: TournamentPlacement;
  isCaptain?: boolean;
  showPlacementBadge?: boolean;
  onOpenStats?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  nombre,
  osu_id,
  rank,
  seed,
  avatar,
  teamLogo,
  teamName,
  placement,
  isCaptain,
  showPlacementBadge = true,
  onOpenStats,
}) => {
  const isChampion = placement?.rank === 1;
  const isRunnerUp = placement?.rank === 2;
  const isThird = placement?.rank === 3;

  // Estilos de borde y resplandor según posición en el torneo
  let cardBorder = 'border border-white/5 hover:border-white/20';
  let glowEffect = '';
  let badgeStyle = 'bg-white/5 text-zinc-400 border border-white/10';

  if (isChampion) {
    cardBorder = 'border-2 border-[#fdc15a]';
    glowEffect = 'shadow-[0_0_30px_rgba(253,193,90,0.35)]';
    badgeStyle = 'bg-[#fdc15a] text-black font-normal shadow-[0_0_12px_rgba(253,193,90,0.4)]';
  } else if (isRunnerUp) {
    cardBorder = 'border-2 border-slate-300';
    glowEffect = 'shadow-[0_0_20px_rgba(203,213,225,0.25)]';
    badgeStyle = 'bg-slate-300 text-black font-normal shadow-[0_0_10px_rgba(203,213,225,0.3)]';
  } else if (isThird) {
    cardBorder = 'border-2 border-amber-600';
    glowEffect = 'shadow-[0_0_20px_rgba(217,119,6,0.25)]';
    badgeStyle = 'bg-amber-600 text-white font-normal shadow-[0_0_10px_rgba(217,119,6,0.3)]';
  } else if (placement && placement.rank <= 6) {
    badgeStyle = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-normal';
  } else if (placement && placement.rank <= 8) {
    badgeStyle = 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-normal';
  }

  // Color para el texto de resultado final (el torneo concluyó)
  let resultadoColor = 'text-zinc-400';
  if (isChampion) resultadoColor = 'text-[#fdc15a] font-bold';
  else if (isRunnerUp) resultadoColor = 'text-slate-300 font-bold';
  else if (isThird) resultadoColor = 'text-amber-500 font-bold';
  else if (placement && placement.rank <= 4) resultadoColor = 'text-cyan-400 font-bold';
  else if (placement && placement.rank <= 6) resultadoColor = 'text-blue-400 font-semibold';
  else if (placement && placement.rank <= 8) resultadoColor = 'text-purple-400 font-semibold';
  else if (!placement) resultadoColor = 'text-zinc-500';

  const resultadoTexto = placement ? placement.title.toUpperCase() : 'QUALIFIERS';

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#1a1a1a] transition-all duration-300 hover:scale-[1.01] ${cardBorder} ${glowEffect}`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 h-full relative z-10">
        {/* IZQUIERDA: Avatar con Link a osu! */}
        <a
          href={osu_id ? `https://osu.ppy.sh/users/${osu_id}` : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 group/avatar mx-auto sm:mx-0"
          title={`Ver perfil de ${nombre} en osu!`}
        >
          <div className="w-full h-full bg-black/60 rounded-xl overflow-hidden border border-white/10 transition-all group-hover/avatar:border-[#fdc15a]">
            <img
              src={avatar || (osu_id ? `https://a.ppy.sh/${osu_id}` : '/no-avatar.png')}
              alt={nombre}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/no-avatar.png';
              }}
            />
          </div>
          {/* Overlay hover */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-xl">
            <span className="text-[10px] font-black text-[#fdc15a] uppercase tracking-wider">
              OSU! ↗
            </span>
          </div>
        </a>

        {/* DERECHA: Info del Jugador */}
        <div className="flex flex-col justify-between flex-grow min-w-0">
          {/* Fila superior: Nickname, Team y Posición en Brackets */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    onClick={onOpenStats}
                    className={`font-['ITCMachine'] text-2xl sm:text-3xl text-white tracking-wide truncate ${
                      onOpenStats
                        ? 'cursor-pointer hover:text-[#fdc15a] transition-colors'
                        : ''
                    }`}
                    title={onOpenStats ? `Ver historial de scores de ${nombre}` : undefined}
                  >
                    {nombre}
                  </h2>
                  {isCaptain && (
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-[#fdc15a]/20 text-[#fdc15a] border border-[#fdc15a]/40 uppercase tracking-tighter"
                      title="Capitán / Seed Principal del equipo"
                    >
                      <svg className="w-2.5 h-2.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                      </svg>
                      <span>CAPITÁN</span>
                    </span>
                  )}
                </div>

                {/* Equipo */}
                {teamName && (
                  <div className="flex items-center gap-2 mt-1">
                    {teamLogo && (
                      <img
                        src={teamLogo}
                        alt={teamName}
                        className="w-4 h-4 rounded-full object-contain bg-white/5"
                      />
                    )}
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">
                      {teamName}
                    </span>
                  </div>
                )}
              </div>

              {/* Badge de Posición en Brackets (Se oculta en vista por equipos para evitar repetir "TOP" innecesariamente) */}
              {showPlacementBadge && (
                placement ? (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-['ITCMachine'] uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0 ${badgeStyle}`}
                  >
                    <span>{placement.title}</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/5 text-zinc-500 border border-white/5">
                    Qualifiers
                  </div>
                )
              )}
            </div>

            {/* Métricas: Rank 4K, Seeding y Resultado Final */}
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 mt-3.5 pt-3 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-widest font-sans">
                  RANK NACIONAL
                </span>
                <span className="font-['ITCMachine'] text-xl text-white">#{rank}</span>
              </div>

              <div className="h-7 w-[1px] bg-white/10"></div>

              <div className="flex flex-col">
                <span className="text-[#fdc15a] font-bold text-[9px] uppercase tracking-widest font-sans">
                  SEEDING
                </span>
                <span className="font-['ITCMachine'] text-xl text-[#fdc15a]">
                  #{seed || '??'}
                </span>
              </div>

              <div className="h-7 w-[1px] bg-white/10"></div>

              <div className="flex flex-col">
                <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-widest font-sans">
                  RESULTADO
                </span>
                <span
                  className={`text-[11px] uppercase font-mono mt-0.5 tracking-wider ${resultadoColor}`}
                >
                  {resultadoTexto}
                </span>
              </div>
            </div>
          </div>

          {/* Botones inferiores */}
          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
            {onOpenStats ? (
              <button
                type="button"
                onClick={onOpenStats}
                className="group/btn text-[10px] font-black text-zinc-400 hover:text-[#fdc15a] uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Ver historial completo de scores y partidas de ${nombre}`}
              >
                <span>VER ESTADÍSTICAS</span>
                <svg
                  className="w-3 h-3 stroke-current stroke-2 fill-none group-hover/btn:translate-x-0.5 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ) : (
              <Link
                href={`/estadisticas?player=${encodeURIComponent(nombre)}`}
                className="group/btn text-[10px] font-black text-zinc-400 hover:text-[#fdc15a] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                title={`Ver estadísticas de ${nombre} en Qualifiers`}
              >
                <span>VER ESTADÍSTICAS</span>
                <svg
                  className="w-3 h-3 stroke-current stroke-2 fill-none group-hover/btn:translate-x-0.5 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}

            <a
              href={`https://osu.ppy.sh/users/${osu_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
            >
              osu! id: {osu_id}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;