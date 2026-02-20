// 1. Interfaz completa y corregida
interface LobbyData {
  id: string;
  match_id: string;
  match_time: string;
  status: string;
  matches: {
    stage: string;
    team_1: {
      name: string;
      logo_url: string | null;
    };
    team_2: {
      name: string;
      logo_url: string | null;
    };
  };
}

// Incluimos las props de interactividad
interface AgendaSidebarProps {
  lobbies: LobbyData[] | null;
  activeId: string | null;
  onHover: (id: string | null) => void;
}

export default function AgendaSidebar({ lobbies, activeId, onHover }: AgendaSidebarProps) {
  return (
    // Contenedor principal (Quitamos el duplicado)
    <div className="w-80 bg-[#1a1a1a] p-4 border-r border-zinc-800 h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-[#fdc15a] font-['ITCMachine'] text-xl mb-6 border-b border-zinc-700 pb-2 uppercase">
        Próximos Cruces
      </h2>
      
      <div className="flex flex-col gap-4">
        {/* Usamos ?. para evitar errores si lobbies es null */}
        {lobbies?.map((lobby) => (
          <div 
            key={lobby.id}
            onMouseEnter={() => onHover(lobby.match_id)}
            onMouseLeave={() => onHover(null)}
            className={`p-3 rounded-md transition-all duration-300 border cursor-default ${
              activeId === lobby.match_id 
                ? 'bg-zinc-800 border-[#fdc15a] scale-[1.02] shadow-lg' 
                : 'bg-zinc-900 border-transparent'
            }`}
          >
            {/* Header de la Card: Etapa y Fecha */}
            <div className="flex justify-between items-start text-[14px] mb-3 font-bold uppercase">
              <span className="text-zinc-500">{lobby.matches.stage}</span>
              <div className="flex flex-col items-end">
                <span className="text-[#fdc15a]">
                  {new Date(lobby.match_time).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')}
                </span>
                <span className="text-white opacity-80">
                  {new Date(lobby.match_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' , hour12: false})} HS
                </span>
              </div>
            </div>
            
            {/* Contenido: Equipos VS */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col items-center flex-1">
                <img 
                  src={lobby.matches.team_1.logo_url || '/no-logo.png'} 
                  className="w-8 h-8 mb-1 object-contain" 
                  alt="Logo T1"
                />
                <span className="text-[14px] font-bold text-center truncate w-full">
                  {lobby.matches.team_1.name}
                </span>
              </div>

              <span className="text-[#fdc15a] font-black italic text-[14px] opacity-80">VS</span>

              <div className="flex flex-col items-center flex-1">
                <img 
                  src={lobby.matches.team_2.logo_url || '/no-logo.png'} 
                  className="w-8 h-8 mb-1 object-contain" 
                  alt="Logo T2"
                />
                <span className="text-[14px] font-bold text-center truncate w-full">
                  {lobby.matches.team_2.name}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}