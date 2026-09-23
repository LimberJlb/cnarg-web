// src/components/StaffCard.tsx
import React from 'react';

export interface StaffCardProps {
  id?: string;
  name: string;
  osuId: string;
  roles: string[];
  avatarUrl?: string;
  customLinks?: { label: string; url: string }[] | null;
  isSmall?: boolean;
  isHost?: boolean;
}

// Obtener colores por rol sin emojis
export const getRoleBadgeStyle = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('host')) {
    return 'bg-[#fdc15a]/20 text-[#fdc15a] border-[#fdc15a]/40 font-bold';
  }
  if (r.includes('map') || r.includes('leading') || r.includes('creator') || r.includes('suggestor') || r.includes('helper')) {
    return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  }
  if (r.includes('referee')) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (r.includes('stream') || r.includes('caster')) {
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  }
  if (r.includes('music') || r.includes('gfx') || r.includes('artist')) {
    return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
  }
  if (r.includes('playtest') || r.includes('replay')) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }
  if (r.includes('dev') || r.includes('sheet')) {
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  }
  if (r.includes('agradecimiento')) {
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
  return 'bg-white/5 text-zinc-300 border-white/10';
};

const StaffCard: React.FC<StaffCardProps> = ({
  name,
  osuId,
  roles,
  avatarUrl,
  customLinks,
  isSmall,
  isHost,
}) => {
  const destinationUrl = osuId
    ? `https://osu.ppy.sh/users/${osuId}`
    : customLinks && customLinks.length > 0
    ? customLinks[0].url
    : '#';

  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const finalAvatar = avatarUrl
    ? avatarUrl
    : osuId
    ? `https://a.ppy.sh/${osuId}`
    : `/avatars/${cleanName}.jpg`;

  const overlayText = destinationUrl.includes('soundcloud.com')
    ? 'SOUNDCLOUD'
    : destinationUrl.includes('osu.ppy.sh')
    ? 'VER EN OSU!'
    : 'VER PERFIL';

  const cardBorder = isHost
    ? 'border border-[#fdc15a]/60 shadow-[0_0_15px_rgba(253,193,90,0.15)] hover:border-[#fdc15a]'
    : 'border border-white/10 hover:border-[#fdc15a]/80';

  return (
    <div
      className={`group relative flex flex-col justify-between bg-[#1a1a1a] ${cardBorder} rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(253,193,90,0.25)] w-full`}
    >
      <div>
        {/* Foto de perfil */}
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full aspect-square mb-3.5 overflow-hidden rounded-lg cursor-pointer bg-black/40 border border-white/5 group/img"
        >
          <img
            src={finalAvatar}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            alt={`Perfil de ${name}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/no-avatar.svg';
            }}
          />

          {/* Overlay hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-[#fdc15a] font-['ITCMachine'] text-xs tracking-widest border border-[#fdc15a]/60 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded inline-flex items-center gap-1.5">
              <span>{overlayText}</span>
              <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60"></div>
        </a>

        {/* Nombre */}
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block font-['ITCMachine'] ${
            isSmall ? 'text-sm sm:text-base' : 'text-base sm:text-xl'
          } text-white hover:text-[#fdc15a] transition-colors mb-2 uppercase tracking-wide truncate`}
          title={name}
        >
          {name}
        </a>

        {/* Lista de Roles */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {roles.map((role) => (
            <span
              key={role}
              className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-full tracking-wider ${getRoleBadgeStyle(
                role
              )}`}
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Links Personalizados (ej: Music Artists, GFX) */}
      {customLinks && customLinks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2.5 mt-auto border-t border-white/5">
          {customLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-zinc-300 hover:text-[#fdc15a] uppercase tracking-tight transition-colors inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 hover:border-[#fdc15a]/40"
            >
              <span>{link.label}</span>
              <svg className="w-2.5 h-2.5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* Barrita inferior animada */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fdc15a] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-xl"></div>
    </div>
  );
};

export default StaffCard;