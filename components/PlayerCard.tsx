import React from 'react';

interface PlayerCardProps {
  nombre: string;
  osu_id: string | number;
  rank: number | string; // Permitimos string por si viene "TBD"
  seed: number | string; // <-- Nueva prop para el Seeding
  avatar?: string; 
  teamLogo?: string; // <-- Nueva prop
  teamName?: string; // <-- Agregar
  estado?: string;
  index: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  nombre,
  osu_id,
  rank,
  seed,
  avatar, // <-- 1. IMPORTANTE: Ahora recibimos el avatar aquí
  teamLogo,
  teamName,
  estado,
  index,
}) => {
  const isEven = index % 2 === 0;
  
  const yellowColor = '#fdc15a';
  const blueColor = '#67a4da';
  const greenColor = '#4ade80';

  // Nota: Tailwind a veces tiene problemas con variables dinámicas en [] 
  // si no están pre-definidas. Si no ves los colores, usaremos clases estándar.
  const gradientClass = isEven
    ? `from-[#fdc15a] to-[#67a4da]`
    : `from-[#4ade80] to-[#67a4da]`;
  
  const nameColorClass = isEven ? `text-[#fdc15a]` : `text-[#67a4da]`;

  return (
    <div className={`relative p-[3px] rounded-3xl overflow-hidden bg-gradient-to-r ${gradientClass} shadow-xl transition-transform hover:scale-[1.02]`}>
      
      <div className="bg-[#1a1a1a] rounded-[calc(1.5rem-3px)] p-5 flex gap-5 h-full relative z-10">
        
        {/* IZQUIERDA: Imagen con Link al Perfil */}
        <a 
          href={`https://osu.ppy.sh/users/${osu_id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative w-32 h-32 md:w-36 md:h-36 flex-shrink-0 group/avatar"
        >
          <div className="w-full h-full bg-black/50 rounded-2xl overflow-hidden border border-white/5 transition-all group-hover/avatar:border-[#fdc15a]/50">
            <img 
              src={avatar || `https://a.ppy.sh/${osu_id}`} 
              alt={nombre} 
              className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110"
            />
          </div>
          {/* Overlay que aparece al hacer hover sobre la foto */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl">
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Ver Perfil</span>
          </div>
        </a>

        {/* CONTENEDOR INFO DERECHA */}
        <div className="flex flex-grow justify-between py-1">
          
          

          {/* DERECHA: Info */}
        <div className="flex flex-col flex-grow justify-between cursor-default py-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className={`font-['ITCMachine'] text-3xl tracking-wide truncate ${nameColorClass}`}>
                {nombre}
              </h2>
              <div className="flex gap-4 mt-1">
                <div className="flex flex-col">
                  <span className="text-white/40 font-bold text-[8px] uppercase tracking-widest">RANK 4K</span>
                  <span className="font-['ITCMachine'] text-2xl text-white">#{rank}</span>
                </div>
                {/* Visualización del SEED */}
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[#fdc15a] font-bold text-[8px] uppercase tracking-widest">SEEDING</span>
                  <span className="font-['ITCMachine'] text-2xl text-[#fdc15a]">#{seed || '??'}</span>
                </div>
              </div>
            </div>

            {/* Logo y Nombre del Team (Apilados arriba) */}
            <div className="flex flex-col items-end gap-2"> {/* Más espacio entre logo y texto */}
              {teamLogo && (
                <div className="w-15 h-15 bg-white/5 rounded-xl border border-white/10 shadow-inner flex items-center justify-center">
                  <img 
                    src={teamLogo} 
                    alt={teamName} 
                    className="w-full h-full object-cover rounded-lg" // Importante: mantiene la proporción
                    />
                </div>
              )}
              {teamName && (
              <span className="text-[#fdc15a] font-['ITCMachine'] text-sm uppercase tracking-widest text-right max-w-[130px] leading-tight">
                    {teamName}
              </span>
              )}
            </div>
          </div>

            {/* Botón de Estado (Abajo de todo) */}
  <div 
    className={`px-6 py-2.5 rounded-full text-[11px] font-['TrebuchetMS'] uppercase font-black tracking-widest transform skew-x-[-15deg] shadow-lg
      ${estado?.toLowerCase() === 'participando' ? 'bg-green-600' : 'bg-red-600'}`}
  >
    <span className="block transform skew-x-[15deg] text-white">
      {estado || 'no qualifiers'}
    </span>
    
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

export default PlayerCard;