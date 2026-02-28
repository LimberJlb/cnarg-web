'use client';

import React from 'react';

interface LobbyData {
  id: string;
  match_id: string;
  match_time: string;
  status: string;
  matches?: {
    stage: string;
    bracket_group: string; // <-- Asegúrate de que esta columna esté en tu consulta
    team_1?: {
      name: string;
      logo_url: string | null;
    } | null;
    team_2?: {
      name: string;
      logo_url: string | null;
    } | null;
  } | null;
}

interface AgendaSidebarProps {
  lobbies: LobbyData[] | null;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onMatchClick?: (matchId: string) => void;
}

export default function AgendaSidebar({ lobbies, activeId, onHover, onMatchClick }: AgendaSidebarProps) {
  return (
    <div className="w-80 bg-[#1a1a1a] p-4 border-r border-zinc-800 h-full overflow-y-auto custom-scrollbar shadow-2xl z-20">
      <h2 className="text-[#fdc15a] font-['ITCMachine'] text-xl mb-6 border-b border-zinc-700 pb-2 uppercase tracking-widest">
        Próximos Cruces
      </h2>
      
      <div className="flex flex-col gap-4">
        {lobbies?.map((lobby) => {
          // DETERMINAMOS EL COLOR SEGÚN EL BRACKET
          const isLosers = lobby.matches?.bracket_group?.toLowerCase() === 'losers';
          const themeColor = isLosers ? '#67a4da' : '#fdc15a';
          const themeShadow = isLosers ? 'rgba(103,164,218,0.2)' : 'rgba(252,193,90,0.2)';

          return (
            <div 
              key={lobby.id}
              onMouseEnter={() => onHover(lobby.match_id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onMatchClick?.(lobby.match_id)} 
              className={`p-3 rounded-md transition-all duration-300 border cursor-pointer group`}
              style={{
                backgroundColor: activeId === lobby.match_id ? '#27272a' : '#18181b',
                borderColor: activeId === lobby.match_id ? themeColor : 'transparent',
                boxShadow: activeId === lobby.match_id ? `0 0 15px ${themeShadow}` : 'none',
                transform: activeId === lobby.match_id ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {/* Header: Etapa y Fecha */}
              <div className="flex justify-between items-start text-[11px] mb-3 font-bold uppercase tracking-tighter">
                <span className={`transition-colors ${activeId === lobby.match_id ? 'text-white' : 'text-zinc-500'}`}>
                  {lobby.matches?.stage || 'TBD'}
                </span>
                <div className="flex flex-col items-end">
                  <span style={{ color: themeColor }}>
                    {lobby.match_time 
                      ? new Date(lobby.match_time).toLocaleDateString('es-AR', { 
                          weekday: 'short', day: '2-digit', month: '2-digit' 
                        }).replace('.', '')
                      : '---'
                    }
                  </span>
                  <span className="text-white opacity-60">
                    {lobby.match_time 
                      ? new Date(lobby.match_time).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', minute: '2-digit', hour12: false 
                        }) 
                      : '--:--'
                    } HS
                  </span>
                </div>
              </div>
              
              {/* Contenido: Equipos VS */}
              <div className="flex items-center justify-between gap-2 relative">
                {/* TEAM 1 */}
                <div className="flex flex-col items-center flex-1">
                  <img 
                    src={lobby.matches?.team_1?.logo_url || '/no-logo.png'} 
                    className={`w-8 h-8 mb-1 object-contain transition-transform duration-500 ${activeId === lobby.match_id ? 'scale-110' : ''}`} 
                    alt="Logo T1"
                  />
                  <span className={`text-[12px] font-bold text-center truncate w-full transition-colors ${activeId === lobby.match_id ? 'text-white' : 'text-zinc-400'}`}>
                    {lobby.matches?.team_1?.name || "TBD"}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center">
                   <span 
                    style={{ color: themeColor }}
                    className="font-black italic text-[12px] opacity-100 group-hover:opacity-100 transition-opacity"
                   >
                    VS
                   </span>
                </div>

                {/* TEAM 2 */}
                <div className="flex flex-col items-center flex-1">
                  <img 
                    src={lobby.matches?.team_2?.logo_url || '/no-logo.png'} 
                    className={`w-8 h-8 mb-1 object-contain transition-transform duration-500 ${activeId === lobby.match_id ? 'scale-110' : ''}`} 
                    alt="Logo T2"
                  />
                  <span className={`text-[12px] font-bold text-center truncate w-full transition-colors ${activeId === lobby.match_id ? 'text-white' : 'text-zinc-400'}`}>
                    {lobby.matches?.team_2?.name || "TBD"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}