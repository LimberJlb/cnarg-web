import React from 'react';

interface PlayerCardProps {
  nombre: string;
  osu_id: string | number;
  rank: number | string; // Permitimos string por si viene "TBD"
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
        
        {/* IZQUIERDA: Imagen del Avatar */}
        <div className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0 bg-black/50 rounded-2xl overflow-hidden shadow-inner border border-white/5">
          <img 
            // 2. LÓGICA DE IMAGEN: Usa el avatar de la DB o el de la API de osu! por defecto
            src={avatar || `https://a.ppy.sh/${osu_id}`} 
            alt={nombre} 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = 'https://osu.ppy.sh/images/layout/avatar-guest.png'; }}
          />
        </div>

        {/* CONTENEDOR INFO DERECHA */}
        <div className="flex flex-grow justify-between py-1">
          
          {/* LADO IZQUIERDO DE LA INFO (Nombre y Rank) */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className={`font-['ITCMachine'] text-3xl uppercase tracking-wide truncate ${nameColorClass}`}>
                {nombre}
              </h2>
              <div className="flex flex-col mt-1">
                <span className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">RANK 4K ARG</span>
                <span className="font-['ITCMachine'] text-5xl text-white leading-none">#{rank}</span>
              </div>
            </div>
            
            <div className="text-[10px] text-white/20 font-bold uppercase">
              ID: {osu_id}
            </div>
          </div>

          {/* LADO DERECHO DE LA INFO (Logo -> Team Name -> Estado) */}
          <div className="flex flex-col items-end justify-between min-w-[120px]">
            
            {/* Logo y Nombre del Team (Apilados arriba) */}
            <div className="flex flex-col items-end gap-1">
              {teamLogo && (
                <div className="w-16 h-16 bg-white/5 rounded-xl p-1.5 border border-white/10 shadow-inner">
                  <img 
                    src={teamLogo} 
                    alt={teamName} 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              {teamName && (
                <span className="text-[#fdc15a] font-['ITCMachine'] text-[10px] uppercase tracking-wider text-right max-w-[100px] truncate">
                  {teamName}
                </span>
              )}
            </div>

            {/* Botón de Estado (Abajo de todo) */}
            <div 
              className={`px-5 py-2 rounded-full text-[10px] font-['TrebuchetMS'] uppercase font-black tracking-widest transform skew-x-[-15deg] shadow-lg
                ${estado?.toLowerCase() === 'participando' ? 'bg-green-600' : 'bg-red-600'}`}
            >
              <span className="block transform skew-x-[15deg] text-white">
                {estado || 'PENDIENTE'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlayerCard;