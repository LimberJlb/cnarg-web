'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MatchCard from '../../components/MatchCard';
import AgendaSidebar from '../../components/AgendaSidebar';
import { getUpcomingLobbies } from '../../lib/queries';
import BracketSelectorBtn from '../../components/BracketSelectorBtn';

export default function BracketsPage() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [bracketView, setBracketView] = useState<'winners' | 'losers'>('winners');
  const [loading, setLoading] = useState(true);
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [hoveredTeamName, setHoveredTeamName] = useState<string | null>(null);

  const manualConnectors: { [key: number]: 'up' | 'down' | 'straight' } = {
    1: 'down', 2: 'up',
    3: 'down', 4: 'up',
    5: 'down', 6: 'up',
    7: 'down', 8: 'up',
    9: 'down', 10: 'up',
    11: 'down', 12: 'up',
    13: 'down', 14: 'up',
    15: 'straight'
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [sidebarData, { data: matchesData }] = await Promise.all([
          getUpcomingLobbies(),
          supabase.from('matches').select(`
            *,
            team_1:teams!team_1_id (name, logo_url),
            team_2:teams!team_2_id (name, logo_url),
            lobbies (
              match_time, 
              status, 
              referee:staff!referee_id(nickname), 
              streamer:staff!streamer_id(nickname), 
              caster1:staff!caster_1_id(nickname), 
              caster2:staff!caster_2_id(nickname)
            )
          `)
        ]);
        setLobbies(sidebarData || []);
        setPartidos(matchesData || []);
      } catch (error) {
        console.error("Error cargando la CNARG:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getMatchesByRound = (bracket: string, round: string) => {
    return partidos
      .filter(p => 
        p.bracket_group?.toLowerCase() === bracket.toLowerCase() && 
        p.stage === round
      )
      .sort((a, b) => (a.match_order || 0) - (b.match_order || 0)); 
  };

  const getHoverProps = (match: any) => ({
    isHighlighted: hoveredMatchId === match.id || 
                    match.team_1?.name === hoveredTeamName || 
                    match.team_2?.name === hoveredTeamName,
    onMouseEnter: () => setHoveredMatchId(match.id),
    onMouseLeave: () => { setHoveredMatchId(null); setHoveredTeamName(null); },
    onTeamHover: setHoveredTeamName,
    isTeamActive: hoveredTeamName
  });

  if (loading) return <div className="h-screen bg-[#2e2e2e] flex items-center justify-center font-['ITCMachine'] text-[#fdc15a] text-4xl animate-pulse">CARGANDO BRACKETS...</div>;

  return (
    /**
     * fixed inset-0: Clava el div a los bordes de la pantalla.
     * overflow-hidden: Mata el scrollbar global de la derecha.
     */
    <div className="fixed inset-0 pt-[80px] w-full h-full flex flex-col bg-[#2e2e2e] overflow-hidden select-none">
      
      <div className="flex flex-1 h-full overflow-hidden">
        
        {/* SIDEBAR: Mantiene su propio scroll interno si está configurado en su componente */}
        <AgendaSidebar lobbies={lobbies} activeId={hoveredMatchId} onHover={setHoveredMatchId} />

        {/* MAIN: El único lugar donde se permite scroll (horizontal y vertical) */}
        <main className="flex-1 h-full overflow-auto p-8 custom-scrollbar">
          <div className="ml-10 mb-8">
            <h1 className="font-['ITCMachine'] text-[80px] lg:text-[100px] uppercase text-white leading-none text-shadow-lg">
              BRACKETS
            </h1>
          </div>

          <div className="flex ml-10 gap-8 mb-10">
            <BracketSelectorBtn label="WINNERS" isActive={bracketView === 'winners'} onClick={() => setBracketView('winners')} variant="winners" />
            <BracketSelectorBtn label="LOSERS" isActive={bracketView === 'losers'} onClick={() => setBracketView('losers')} variant="losers" />
          </div>

          {/* CONTENEDOR DE LAS COLUMNAS: Aquí es donde se genera el scroll interno */}
          <div className="inline-flex gap-32 px-8 min-h-[1300px] items-stretch pb-40">
            {bracketView === 'winners' && (
              <>
                <BracketColumn title="ROUND OF 16" color="#fdc15a">
                  {getMatchesByRound('winners', 'Round of 16').map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      p1={match.team_1?.name || "TBD"}
                      p2={match.team_2?.name || "TBD"}
                      logo1={match.team_1?.logo_url}
                      logo2={match.team_2?.logo_url}
                      s1={match.score_1 || 0}
                      s2={match.score_2 || 0}
                      estado={match.lobbies?.[0]?.status || 'SCHEDULED'}
                      {...getHoverProps(match)} 
                      showConnector={true} 
                      connectorType={manualConnectors[match.match_order] || 'straight'} 
                    />
                  ))}
                </BracketColumn>

                <BracketColumn title="QUARTERFINALS" color="#fdc15a">
                  {getMatchesByRound('winners', 'Quarterfinals').map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      p1={match.team_1?.name || "TBD"}
                      p2={match.team_2?.name || "TBD"}
                      logo1={match.team_1?.logo_url}
                      logo2={match.team_2?.logo_url}
                      s1={match.score_1 || 0}
                      s2={match.score_2 || 0}
                      estado={match.lobbies?.[0]?.status || 'SCHEDULED'}
                      {...getHoverProps(match)} 
                      showConnector={true} 
                      connectorType={manualConnectors[match.match_order] || 'straight'} 
                    />
                  ))}
                </BracketColumn>

                <BracketColumn title="SEMIFINALS" color="#fdc15a">
                  {getMatchesByRound('winners', 'Semifinals').map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      p1={match.team_1?.name || "TBD"}
                      p2={match.team_2?.name || "TBD"}
                      logo1={match.team_1?.logo_url}
                      logo2={match.team_2?.logo_url}
                      s1={match.score_1 || 0}
                      s2={match.score_2 || 0}
                      estado={match.lobbies?.[0]?.status || 'SCHEDULED'}
                      {...getHoverProps(match)} 
                      showConnector={true} 
                      connectorType={manualConnectors[match.match_order] || 'straight'} 
                    />
                  ))}
                </BracketColumn>

                <BracketColumn title="FINALS" color="#fdc15a">
                  {getMatchesByRound('winners', 'Finals').map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      p1={match.team_1?.name || "TBD"}
                      p2={match.team_2?.name || "TBD"}
                      logo1={match.team_1?.logo_url}
                      logo2={match.team_2?.logo_url}
                      s1={match.score_1 || 0}
                      s2={match.score_2 || 0}
                      estado={match.lobbies?.[0]?.status || 'SCHEDULED'}
                      {...getHoverProps(match)} 
                      showConnector={true} 
                      connectorType={manualConnectors[match.match_order] || 'straight'} 
                    />
                  ))}
                </BracketColumn>

                <BracketColumn title="GRAND FINALS" color="#fdc15a">
                  {getMatchesByRound('winners', 'Grand Finals').map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      p1={match.team_1?.name || "TBD"}
                      p2={match.team_2?.name || "TBD"}
                      logo1={match.team_1?.logo_url}
                      logo2={match.team_2?.logo_url}
                      s1={match.score_1 || 0}
                      s2={match.score_2 || 0}
                      estado={match.lobbies?.[0]?.status || 'SCHEDULED'}
                      {...getHoverProps(match)} 
                    />
                  ))}
                </BracketColumn>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function BracketColumn({ title, children, color }: { title: string, children: React.ReactNode, color: string }) {
  const columnWidth = "w-[300px]"; 

  return (
    <div className={`flex flex-col ${columnWidth}`}>
      <div className="h-24 flex items-center">
        <h3 
          className="w-full text-center font-['ITCMachine'] bg-black/40 py-4 text-xl tracking-widest uppercase border-b-2" 
          style={{ color, borderColor: color }}
        >
          {title}
        </h3>
      </div>
      <div className="flex-1 flex flex-col justify-around py-20">
        {children}
      </div>
    </div>
  );
}