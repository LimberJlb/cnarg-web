'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MatchCard from '../../components/MatchCard';
import AgendaSidebar from '../../components/AgendaSidebar';
import { getUpcomingLobbies } from '../../lib/queries';

// --- CONFIGURACIÓN DE COORDENADAS MANUALES ---
const MANUAL_POSITIONS: { [key: number]: { row: number; span: number } } = {
  1: { row: 1, span: 4 }, 2: { row: 3, span: 4 }, 3: { row: 5, span: 4 }, 4: { row: 7, span: 4 }, 
  5: { row: 9, span: 4 }, 6: { row: 11, span: 4 }, 7: { row: 13, span: 4 }, 8: { row: 15, span: 4 },
  9: { row: 1, span: 4 }, 10: { row: 3, span: 4 }, 11: { row: 5, span: 4 }, 12: { row: 7, span: 4 }, 
  13: { row: 2, span: 4 }, 14: { row: 6, span: 4 }, 15: { row: 10, span: 4 }, 16: { row: 14, span: 4 },
  17: { row: 1, span: 4 }, 18: { row: 3, span: 4 }, 19: { row: 5, span: 4 }, 20: { row: 7, span: 4 },
  21: { row: 2, span: 4 }, 22: { row: 6, span: 4 }, 23: { row: 4, span: 4 }, 24: { row: 12, span: 4 }, 
  25: { row: 2, span: 4 }, 26: { row: 6, span: 4 }, 27: { row: 4, span: 4 }, 28: { row: 8, span: 4 },
  29: { row: 4, span: 4 }, 30: { row: 8, span: 4 }, 31: { row: 8, span: 4 }, 
};

// --- CONFIGURACIÓN DE CONECTORES ---
const manualConnectors: { [key: number]: { type: 'up' | 'down' | 'straight'; step?: number } } = {
    1: { type: 'down', step: 1 }, 2: { type: 'up', step: 1 }, 3: { type: 'down', step: 1 }, 4: { type: 'up', step: 1 }, 
    5: { type: 'down', step: 1 }, 6: { type: 'up', step: 1 }, 7: { type: 'down', step: 1 }, 8: { type: 'up', step: 1 },
    9: { type: 'straight' }, 10: { type: 'straight' }, 11: { type: 'straight' }, 12: { type: 'straight' }, 
    13: { type: 'down', step: 2 }, 14: { type: 'up', step: 2 }, 15: { type: 'down', step: 2 }, 16: { type: 'up', step: 2 },
    17: { type: 'down', step: 1 }, 18: { type: 'up', step: 1 }, 19: { type: 'down', step: 1 }, 20: { type: 'up', step: 1 },
    21: { type: 'straight' }, 22: { type: 'straight' }, 23: { type: 'down', step: 4 }, 24: { type: 'up', step: 4 },  
    25: { type: 'down', step: 2 }, 26: { type: 'up', step: 2 }, 27: { type: 'straight' }, 28: { type: 'straight' },
    29: { type: 'straight' }, 30: { type: 'straight' }, 31: { type: 'straight' },
};

// --- MAPA DE PLACEHOLDERS PARA LOSERS (TIPO CHALLONGE) ---
const LOSER_PLACEHOLDERS: { [key: number]: { p1?: string; p2?: string } } = {
  17: { p1: "Perdedor QF4" },
  18: { p1: "Perdedor QF3" },
  19: { p1: "Perdedor QF2" },
  20: { p1: "Perdedor QF1" },
  25: { p1: "Perdedor SF1" },
  26: { p1: "Perdedor SF2" },
  29: { p1: "Perdedor F1" },
  30: { p2: "Ganador GF R1" },
};

export default function BracketsPage() {
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [hoveredTeamName, setHoveredTeamName] = useState<string | null>(null);

  const activeMatchData = partidos.find(p => p.id === hoveredMatchId);

  const scrollToMatch = (matchId: string) => {
    const element = document.getElementById(`match-${matchId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setHoveredMatchId(matchId);
      setTimeout(() => {
        setHoveredMatchId((prev) => (prev === matchId ? null : prev));
      }, 2000);
    }
  };

  const fetchData = async () => {
    try {
      const [sidebarData, { data: matchesData, error }] = await Promise.all([
        getUpcomingLobbies(),
        supabase.from('matches').select(`
          *,
          team_1:teams!team_1_id (
            id, name, logo_url, 
            players (nickname, avatar_url)
          ),
          team_2:teams!team_2_id (
            id, name, logo_url, 
            players (nickname, avatar_url)
          ),
          results:match_map_results (map_winner_id),
          lobbies (
            status,
            match_time,
            referee:staff!referee_id (nickname),
            streamer:staff!streamer_id (nickname),
            caster_1:staff!caster_1_id (nickname),
            caster_2:staff!caster_2_id (nickname)
          )
        `)
      ]);
      if (error) throw error;
      setLobbies(sidebarData || []);
      setPartidos(matchesData || []);
    } catch (error) {
      console.error("Error cargando la CNARG:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getMatchesByRound = (bracket: string, round: string) => {
    return partidos
      .filter(p => p.bracket_group?.toLowerCase() === bracket.toLowerCase() && p.stage === round)
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

  const getGridPosition = (roundIndex: number, matchIndex: number, matchOrder: number) => {
    const manual = MANUAL_POSITIONS[matchOrder];
    if (manual) {
      return { gridColumn: roundIndex + 1, gridRow: `${manual.row} / span ${manual.span}` };
    }
    const span = Math.pow(2, roundIndex + 1);
    const start = Math.pow(2, roundIndex) + (matchIndex * Math.pow(2, roundIndex + 1));
    return { gridColumn: roundIndex + 1, gridRow: `${start} / span ${span}` };
  };

  const renderBracketSection = (bracketType: 'winners' | 'losers', stages: string[], color: string) => (
    <div className="flex flex-col mb-48">
      <div className="ml-10 mb-10 border-l-4 pl-6" style={{ borderColor: color }}>
        <h2 className="font-['ITCMachine'] text-4xl text-white uppercase tracking-widest">
          {bracketType} Bracket
        </h2>
      </div>
      
      <div 
        className="grid gap-x-32 px-8 auto-rows-[100px]" 
        style={{ gridTemplateColumns: `repeat(${stages.length}, 300px)` }}
      >
        {stages.map((stageTitle, roundIndex) => (
          <React.Fragment key={stageTitle}>
            <div 
              className="mb-8 z-30 bg-[#2e2e2e] sticky top-0 py-2 shadow-lg shadow-black/20"
              style={{ gridColumn: roundIndex + 1, gridRow: '1' }}
            >
              <h3 className="w-full text-center font-['ITCMachine'] bg-black/40 py-4 text-xl tracking-widest uppercase border-b-2" 
                  style={{ color, borderColor: color }}>
                {stageTitle}
              </h3>
            </div>

            {getMatchesByRound(bracketType, stageTitle).map((match, matchIndex) => {
              const position = getGridPosition(roundIndex, matchIndex, match.match_order);
              const connectorConfig = manualConnectors[match.match_order] || { type: 'straight' };

              return (
                <div 
                  key={match.id}
                  className="flex items-center justify-center w-full"
                  style={{ 
                    gridColumn: position.gridColumn, 
                    gridRow: position.gridRow,
                    marginTop: '40px'
                  }}
                >
                  <MatchCard 
                    match={match} 
                    {...getHoverProps(match)} 
                    showConnector={bracketType === 'winners' ? true : stageTitle !== 'GRAND FINALS R1'} 
                    connectorType={connectorConfig.type} 
                    connectorStep={connectorConfig.step || 1}
                    isLosers={bracketType === 'losers'}
                    placeholder1={LOSER_PLACEHOLDERS[match.match_order]?.p1}
                    placeholder2={LOSER_PLACEHOLDERS[match.match_order]?.p2}
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="h-screen bg-[#2e2e2e] flex items-center justify-center font-['ITCMachine'] text-[#fdc15a] text-4xl animate-pulse tracking-widest uppercase">Cargando la CNARG...</div>;

  return (
    <div className="fixed inset-0 pt-[80px] w-full h-full flex flex-col bg-[#2e2e2e] overflow-hidden select-none">
      <div className="flex flex-1 h-full overflow-hidden relative">
        <AgendaSidebar 
          lobbies={lobbies} 
          activeId={hoveredMatchId} 
          onHover={setHoveredMatchId} 
          onMatchClick={scrollToMatch} 
        />
        <MatchDetailPanel match={activeMatchData} />
        <main className="flex-1 h-full overflow-auto p-8 custom-scrollbar">
          <div className="ml-10 mb-16">
            <h1 className="font-['ITCMachine'] text-[80px] lg:text-[100px] uppercase text-white leading-none text-shadow-lg">
              BRACKETS
            </h1>
          </div>
          {renderBracketSection('winners', ['ROUND OF 16', 'QUARTERFINALS', 'SEMIFINALS', 'FINALS', 'GRAND FINALS'], '#fdc15a')}
          <div className="h-[2px] bg-white/5 w-full my-32" />
          {renderBracketSection('losers', ['QUARTERFINALS R1', 'SEMIFINALS R1', 'SEMIFINALS R2', 'FINALS R1', 'FINALS R2', 'GRAND FINALS R1'], '#67a4da')}
        </main>
      </div>
    </div>
  );
}

function MatchDetailPanel({ match }: { match: any }) {
  if (!match) return null;

  const lobby = Array.isArray(match.lobbies) ? match.lobbies[0] : match.lobbies;
  if (!lobby) return null;

  const isLosers = match.bracket_group?.toLowerCase() === 'losers';
  const colorClass = isLosers ? 'text-[#67a4da]' : 'text-[#fdc15a]';
  const borderColor = isLosers ? 'border-[#67a4da]' : 'border-[#fdc15a]';
  const accentBg = isLosers ? 'bg-[#67a4da]/10' : 'bg-[#fdc15a]/10';

  const fechaStr = lobby.match_time 
    ? new Date(lobby.match_time).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' }) 
    : 'FECHA TBD';
  const horaStr = lobby.match_time 
    ? new Date(lobby.match_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) 
    : '--:--';

  return (
    <div className={`absolute bottom-6 right-6 z-[300] w-[520px] bg-[#0c0c0c]/98 border-2 ${borderColor} shadow-[0_0_20px_rgba(0,0,0,1)] animate-in fade-in zoom-in slide-in-from-right-10 duration-500 backdrop-blur-3xl rounded-sm overflow-hidden`}>
      
      {/* HEADER */}
      <div className={`p-4 ${accentBg} border-b border-white/10 flex justify-between items-center`}>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">CNARG 2026</span>
          <h3 className={`font-['ITCMachine'] ${colorClass} text-2xl uppercase leading-none tracking-widest`}>
            {match.stage || 'STAGE'}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-sm uppercase">{fechaStr}</p>
          <p className={`${colorClass} font-black text-xs uppercase`}>{horaStr} HS (ARG)</p>
        </div>
      </div>

      {/* ROSTERS ESPEJADOS */}
      <div className="p-6 flex justify-between gap-6 relative">
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] font-['ITCMachine'] text-9xl italic ${colorClass}`}>VS</div>

        {/* TEAM 1 */}
        <div className="flex-1 flex flex-col items-start z-10">
          <div className="flex items-center gap-3 mb-6 w-full">
            <img src={match.team_1?.logo_url || '/no-logo.png'} className="w-10 h-10 object-contain drop-shadow-lg" alt="" />
            <h4 className="text-white font-['ITCMachine'] text-lg uppercase truncate">{match.team_1?.name}</h4>
          </div>
          <div className="space-y-4 w-full">
            {match.team_1?.players?.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className={`w-11 h-11 rounded-full border-2 ${borderColor} overflow-hidden bg-zinc-900 shrink-0`}>
                  <img src={p.avatar_url || '/no-avatar.png'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                </div>
                <span className="text-[15px] text-zinc-200 font-bold tracking-tight truncate">{p.nickname}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM 2 */}
        <div className="flex-1 flex flex-col items-end z-10">
          <div className="flex items-center gap-3 mb-6 w-full justify-end">
            <h4 className="text-white font-['ITCMachine'] text-lg uppercase truncate text-right">{match.team_2?.name}</h4>
            <img src={match.team_2?.logo_url || '/no-logo.png'} className="w-10 h-10 object-contain drop-shadow-lg" alt="" />
          </div>
          <div className="space-y-4 w-full">
            {match.team_2?.players?.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 group justify-end">
                <span className="text-[15px] text-zinc-200 font-bold tracking-tight truncate text-right">{p.nickname}</span>
                <div className={`w-11 h-11 rounded-full border-2 ${borderColor} overflow-hidden bg-zinc-900 shrink-0`}>
                  <img src={p.avatar_url || '/no-avatar.png'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STREAMING BAR */}
      <div className="bg-white/[0.05] py-3 flex justify-center items-center gap-4 border-y border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_#dc2626]"></div>
        </div>
        <span className={`font-['ITCMachine'] text-lg tracking-[0.1em] ${colorClass}`}>
          TWITCH.TV/CNARG_4K
        </span>
      </div>

      {/* STAFF FOOTER */}
      <div className="bg-black/40 p-3 flex justify-between items-center gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest mb-1">⚖️ Referee</span>
          <span className="text-base text-white font-black tracking-tight">{lobby.referee?.nickname || 'Por confirmar'}</span>
        </div>
        
        <div className="flex flex-col items-center text-center px-4 border-x border-white/10 flex-1">
          <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest mb-1">🎙️ Casters</span>
          <div className="flex flex-col">
            <span className="text-base text-white font-black leading-tight tracking-tight">{lobby.caster_1?.nickname || 'Por confirmar'}</span>
            {lobby.caster_2 && <span className="text-base text-white font-black leading-tight tracking-tight uppercase">{lobby.caster_2.nickname}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest mb-1">🎥 Streamer</span>
          <span className="text-base text-white font-black tracking-tight">{lobby.streamer?.nickname || 'Por confirmar'}</span>
        </div>
      </div>

      <div className={`h-2.5 w-full ${isLosers ? 'bg-[#67a4da]' : 'bg-[#fdc15a]'}`}></div>
    </div>
  );
}