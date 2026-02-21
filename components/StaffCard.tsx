// src/components/StaffCard.tsx
import React from 'react';

interface StaffCardProps {
  name: string;
  osuId: string;
  roles: string[];
  avatarUrl?: string;
  customLinks?: { label: string; url: string }[]; // Para los Music Artists
  isSmall?: boolean; // Prop para achicar la tarjeta en Agradecimientos
}

const StaffCard: React.FC<StaffCardProps> = ({ name, osuId, roles, avatarUrl, customLinks, isSmall }) => {

    // 1. Definimos la URL de destino
  // Prioridad: Perfil de osu! > Primer link personalizado > Sin link (#)
  const destinationUrl = osuId 
    ? `https://osu.ppy.sh/users/${osuId}` 
    : (customLinks && customLinks.length > 0 ? customLinks[0].url : '#');

  // Generamos la URL de la foto de osu! si no hay una personalizada
  const finalAvatar = avatarUrl 
    ? avatarUrl 
    : (osuId ? `https://a.ppy.sh/${osuId}` : '/default-avatar.png');

  return (
    <div className={`group relative ${isSmall ? 'w-48' : 'w-64'} bg-[#1a1a1a] border border-white/10 rounded-sm p-4 transition-all duration-300 hover:border-[#fdc15a] hover:scale-105 hover:shadow-[0_0_25px_rgba(252,193,90,0.3)]`}>
      
      {/* 2. Envolvemos la foto en un link */}
      <a 
        href={destinationUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block relative w-full aspect-square mb-4 overflow-hidden rounded-sm cursor-pointer"
      >
        <img 
          src={finalAvatar} 
          className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-125" 
          alt={`Perfil de ${name}`} 
        />
        
        {/* Overlay sutil que aparece al hacer hover para indicar que es clickeable */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-['ITCMachine'] text-xs tracking-widest border border-white/40 px-2 py-1 bg-black/20 backdrop-blur-sm">
            VER PERFIL
          </span>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80"></div>
      </a>

      {/* Nombre (también clickeable) */}
      <a 
        href={destinationUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`block font-['ITCMachine'] ${isSmall ? 'text-lg' : 'text-xl'} text-white hover:text-[#fdc15a] transition-colors mb-2 uppercase`}
      >
        {name}
      </a>

      {/* Lista de Roles (Tags) */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {roles.map((role) => (
          <span 
            key={role} 
            className="text-[9px] font-black uppercase px-2 py-0.5 bg-zinc-800 text-[#fdc15a] border border-[#fdc15a]/20 rounded-full"
          >
            {role}
          </span>
        ))}
      </div>

      {/* Links Personalizados (Solo si existen, ej: Music Artists) */}
      {customLinks && customLinks.length > 0 && (
        <div className="flex gap-2 pt-2 border-t border-white/5">
          {customLinks.map((link) => (
            <a 
              key={link.label}
              href={link.url}
              target="_blank"
              className="text-[10px] text-zinc-500 hover:text-white underline uppercase tracking-tighter"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Barrita inferior animada */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fdc15a] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    </div>
  );
};

export default StaffCard;