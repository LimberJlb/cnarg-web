'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MatchCard from '../../components/MatchCard';
import AgendaSidebar from '../../components/AgendaSidebar';
import { getUpcomingLobbies } from '../../lib/queries';
import BracketSelectorBtn from '../../components/BracketSelectorBtn';

export default function BracketsPage() {
  // --- ESTADOS ---
  const [lobbies, setLobbies] = useState<any[]>([]); // Para la Sidebar
  const [partidos, setPartidos] = useState<any[]>([]); // Para los Brackets
  const [bracketView, setBracketView] = useState<'winners' | 'losers'>('winners');
  
  const [loading, setLoading] = useState(true);
  
  // EL ESTADO MÁGICO: Sincroniza el hover entre Sidebar y Brackets
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Ejecutamos ambas consultas en paralelo para máxima velocidad
        const [sidebarData, { data: matchesData }] = await Promise.all([
          getUpcomingLobbies(),
          supabase
            .from('matches')
            .select(`
              *,
              team_1:teams!team_1_id (name, logo_url, players (nickname)),
              team_2:teams!team_2_id (name, logo_url, players (nickname)),
              lobbies (
                match_time, status, lobby_link,
                referee:staff!referee_id (nickname),
                streamer:staff!streamer_id (nickname),
                caster1:staff!caster_1_id (nickname),
                caster2:staff!caster_2_id (nickname)
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

  // --- LÓGICA FILTRADO ---
  const getMatchesByRound = (bracket: string, round: string) => {
    return partidos.filter(p => 
      p.bracket_group?.toLowerCase() === bracket.toLowerCase() && 
      p.stage === round
    );
  };

  return (
  <div className="h-screen w-full flex flex-col overflow-hidden cursor-default bg-[#2e2e2e]">
      {/* 1. NAV (SIEMPRE ARRIBA) */}
      <nav className="flex justify-between items-center h-22 bg-[#2e2e2e] relative z-30 shadow-[0_9px_50px_rgba(0,0,0,0.5)] w-full">
        <h1 className="text-[#fdc15a] font-['ITCMachine'] text-[60px] px-10">CNARG</h1>
        <div className="flex items-center h-full">
          <div className="flex space-x-9 text-sm font-['TrebuchetMS'] text-[#fdc15a] text-[20px] mr-15">
            <a href="/" className="hover:text-white">INICIO</a>
            <a href="/mappool" className="hover:text-white">MAPPOOL</a>
            <a href="/jugadores" className="hover:text-white">JUGADORES</a>
            <span className="text-white border-b-2 border-[#fdc15a]">BRACKETS</span>
            <a href="/staff" className="hover:text-white">STAFF</a>
            <a href="/estadisticas" className="hover:text-white">ESTADISTICAS</a>
          </div>
          <button className="bg-[#fdc15a] hover:bg-[#d9953d] text-[#2e2e2e] font-['ITCMachine'] h-full px-13 text-[30px] transition-colors">
            INGRESAR
          </button>
        </div>
      </nav>
      

      {/* 2. CONTENEDOR PRINCIPAL (SIDEBAR + CONTENIDO) */}
      <div className="flex flex-1 overflow-hidden" >
      {/* SIDEBAR: Al pasar el mouse aquí, se activa el hoveredMatchId */}
      <AgendaSidebar 
        lobbies={lobbies} 
        activeId={hoveredMatchId} 
        onHover={setHoveredMatchId} 
      />
      

        {/* CONTENIDO DE BRACKETS */}
        <main className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="ml-110 mb-8">
          <h1 className="font-['ITCMachine'] text-[100px] uppercase text-white">BRACKETS</h1>
        </div>

          {/* 2. REEMPLAZAMOS LOS BOTONES VIEJOS AQUÍ */}
        <div className="flex ml-110 gap-18 mb-10">
          <BracketSelectorBtn 
            label="WINNERS"
            isActive={bracketView === 'winners'}
            onClick={() => setBracketView('winners')}
            variant="winners"
          />
          
            <BracketSelectorBtn 
            label="LOSERS"
            isActive={bracketView === 'losers'}
            onClick={() => setBracketView('losers')}
            variant="losers"
          />
        </div>

          {/* BRACKET: Escucha el hoveredMatchId y se ilumina solo */}
        <div className="w-full flex pb-20">
          <div className="inline-flex gap-16 px-10 items-start">
  
  {/* --- VISTA DE WINNERS --- */}
  {bracketView === 'winners' && (
    <>
      {/* 1. Round of 16 */}
      <div className="flex flex-col gap-10">
        <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 text-xl">ROUND OF 16</h3>
        {getMatchesByRound('winners', 'Round of 16').map((match, index) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)} 
          showConnector={true} connectorType={index % 2 === 0 ? 'down' : 'up'}/>
        ))}
        
        
      </div>

      {/* 2. Quarterfinals (Winners) */}
      <div className="flex flex-col gap-10">
        <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 text-xl">QUARTERFINALS</h3>
        {getMatchesByRound('winners', 'Quarterfinals').map((match, index) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)}
          showConnector={true} connectorType={index % 2 === 0 ? 'down' : 'up'} />
        ))}
      </div>

      {/* 3. Semifinals (Winners) */}
      <div className="flex flex-col gap-26">
        <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 text-xl">SEMIFINALS</h3>
        {getMatchesByRound('winners', 'Semifinals').map((match, index) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)} 
          showConnector={true} connectorType={index % 2 === 0 ? 'down' : 'up'}/>
        ))}
      </div>

      {/* 4. Winners Final */}
      <div className="flex flex-col gap-50">
        <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 text-xl">FINALS</h3>
        {getMatchesByRound('winners', 'Finals').map((match) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)}
          showConnector={true}
    connectorType="straight" />
        ))}
      </div>

      {/* 5. Grand Finals */}
      <div className="flex flex-col gap-50">
        <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 text-xl">GRAND FINALS</h3>
        {getMatchesByRound('winners', 'Grand Finals').map((match) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)}
         />
        ))}
      </div>
    </>
  )}

  {/* --- VISTA DE LOSERS (Estructura Challonge) --- */}
  {bracketView === 'losers' && (
    <>
      {/* 1. Quarterfinals R1 */}
      <div className="flex flex-col gap-10">
        <h3 className="text-center font-['ITCMachine'] text-[#67a4da] bg-black/20 py-2 text-xl uppercase">QUARTERFINALS R1</h3>
        {getMatchesByRound('losers', 'Quarterfinals R1').map((match, index) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)} isLosers={true}
          showConnector={true} connectorType={index % 2 === 0 ? 'down' : 'up'}/>
        ))}
      </div>

      {/* 2. Semifinals R1 */}
      <div className="flex flex-col gap-10">
        <h3 className="text-center font-['ITCMachine'] text-[#67a4da] bg-black/20 py-2 text-xl uppercase">SEMIFINALS R1</h3>
        {getMatchesByRound('losers', 'Semifinals R1').map((match) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)} isLosers={true}
          showConnector={true}
    connectorType="straight"/>
        ))}
      </div>

      {/* 3. Semifinals R2 */}
      <div className="flex flex-col gap-10">
        <h3 className="text-center font-['ITCMachine'] text-[#67a4da] bg-black/20 py-2 text-xl uppercase">SEMIFINALS R2</h3>
        {getMatchesByRound('losers', 'Semifinals R2').map((match, index) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)} isLosers={true}
          showConnector={true} connectorType={index % 2 === 0 ? 'down' : 'up'}/>
        ))}
      </div>

      {/* 4. Finals R1 */}
      <div className="flex flex-col gap-27">
        <h3 className="text-center font-['ITCMachine'] text-[#67a4da] bg-black/20 py-2 text-xl uppercase">FINALS R1</h3>
        {getMatchesByRound('losers', 'Finals R1').map((match, index) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)} isLosers={true}
          showConnector={true}
    connectorType="straight"/>
        ))}
      </div>

      {/* 5. Finals R2 (Losers Final) */}
      <div className="flex flex-col gap-27">
        <h3 className="text-center font-['ITCMachine'] text-[#67a4da] bg-black/20 py-2 text-xl uppercase">FINALS R2</h3>
        {getMatchesByRound('losers', 'Finals R2').map((match) => (
          <MatchCard key={match.id} match={match} p1={match.team_1?.name || "TBD"} p2={match.team_2?.name || "TBD"} logo1={match.team_1?.logo_url || '/no-logo.png'} logo2={match.team_2?.logo_url || '/no-logo.png'} s1={match.score_1 || 0} s2={match.score_2 || 0} estado={match.lobbies?.[0]?.status || 'SCHEDULED'} isHighlighted={hoveredMatchId === match.id} onMouseEnter={() => setHoveredMatchId(match.id)} onMouseLeave={() => setHoveredMatchId(null)} isLosers={true}
          />
        ))}
      </div>
    </>
  )}
</div>
          </div>
        </main>
      </div>
    </div>
  );
}