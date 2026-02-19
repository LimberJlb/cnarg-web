import React from 'react';

// Definimos las propiedades que aceptará la tarjeta
interface PlayerCardProps {
  nombre: string;
  osu_id: string | number;
  rank: number; // El número grande (#2, #3)
  
  estado: 'participando' | 'descalificado'; // Solo acepta estos dos valores
  index: number; // Para intercalar los colores (par/impar)
  pais?: string; // Código de país (ej: 'ES', 'AR') - Opcional
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  nombre,
  osu_id,
  rank,
 
  estado,
  index,
}) => {
  // Lógica para intercalar colores: si el índice es par, usa el esquema amarillo-azul. Si es impar, verde-azul.
  const isEven = index % 2 === 0;
  
  // Colores basados en el diseño
  const yellowColor = '#fdc15a';
  const blueColor = '#67a4da';
  const greenColor = '#4ade80'; // Un verde brillante tipo tailwind

  const gradientClass = isEven
    ? `from-[${yellowColor}] to-[${blueColor}]`
    : `from-[${greenColor}] to-[${blueColor}]`;
  
  const nameColorClass = isEven ? `text-[${yellowColor}]` : `text-[${blueColor}]`;

  return (
    // Contenedor principal con el borde degradado
    <div className={`relative p-[3px] rounded-3xl overflow-hidden bg-gradient-to-r ${gradientClass} shadow-xl transition-transform hover:scale-[1.02]`}>
      
      {/* Contenido interno de la tarjeta (fondo oscuro) */}
      <div className="bg-[#1a1a1a] rounded-[calc(1.5rem-3px)] p-5 flex gap-5 h-full relative z-10">
        
        {/* IZQUIERDA: Imagen del Avatar */}
        <div className="w-36 h-36 flex-shrink-0 bg-black/50 rounded-2xl overflow-hidden shadow-inner border border-white/5">
          <img 
            src={`https://a.ppy.sh/${osu_id}`} 
            alt={nombre} 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = 'https://osu.ppy.sh/images/layout/avatar-guest.png'; }} // Avatar por defecto si falla
          />
        </div>

        {/* DERECHA: Información del Jugador */}
        <div className="flex flex-col flex-grow justify-between">
          <div>
            {/* Fila 1: Nombre*/}
            <div className="flex items-center gap-2">
              <h2 className={`font-['ITCMachine'] text-3xl uppercase tracking-wide truncate ${nameColorClass}`}>
                {nombre}
              </h2>
              
            </div>
        </div>

            {/* Fila 2: Rank Global */}
            <div className="flex items-baseline gap-3 mt-1">
              <span className={`font-['ITCMachine'] text-4xl ${isEven ? 'text-green-500' : 'text-green-400'}`}>
                #{rank}
              </span>
              
            </div>
        

          {/* Fila 3 (Inferior): Rank Nacional y Estado */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-gray-500 font-['TrebuchetMS'] uppercase tracking-wider mb-1">
                RANK NACIONAL
              </p>
              
            </div>

            {/* Botón de Estado */}
            <div 
              className={`px-6 py-2 rounded-full text-xs font-['TrebuchetMS'] uppercase font-black tracking-widest shadow-lg transform skew-x-[-10deg]
                ${estado === 'participando' 
                  ? 'bg-green-600 text-white shadow-green-600/40' 
                  : 'bg-red-600 text-white shadow-red-600/40'}`
              }
            >
              <span className="block transform skew-x-[10deg]"> {/* Contrarestrar la inclinación del texto */}
                {estado}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para obtener el emoji de la bandera
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default PlayerCard;