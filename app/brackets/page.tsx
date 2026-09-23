'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import MatchCard from '../../components/MatchCard';
import MatchHistorySidebar from '../../components/MatchHistorySidebar';
import MatchDetailPanel from '../../components/MatchDetailPanel';
import LoadingScreen from '../../components/LoadingScreen';
import { Match, getSafeLobby } from '../../types/bracket';
import {
  MANUAL_POSITIONS,
  MANUAL_CONNECTORS,
  LOSER_PLACEHOLDERS,
  WINNERS_STAGES,
  LOSERS_STAGES,
} from '../../lib/bracketConfig';

let bracketsCache: Match[] | null = null;

async function fetchWithRetry<T = any>(
  fn: () => PromiseLike<{ data: T | null; error: any }> | Promise<{ data: T | null; error: any }>,
  retries = 2,
  delayMs = 1200
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fn();
      if (!res.error && res.data) return res;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return res;
      }
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return { data: null, error: err };
      }
    }
  }
  return { data: null, error: new Error('Exceeded retries') };
}

export default function BracketsPage() {
  const [partidos, setPartidos] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);
  const [hoveredTeamName, setHoveredTeamName] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Moverse con click izquierdo
  const isDragging = useRef(false);
  const dragDistance = useRef(0);
  const startPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Permitir arrastrar exclusivamente con el clic izquierdo
    if (e.button !== 0) return;
    isDragging.current = true;
    dragDistance.current = 0;
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: mainRef.current?.scrollLeft || 0,
      scrollTop: mainRef.current?.scrollTop || 0,
    };
    setIsGrabbing(true);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !mainRef.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      dragDistance.current = Math.hypot(dx, dy);

      if (dragDistance.current > 3) {
        mainRef.current.scrollLeft = startPos.current.scrollLeft - dx;
        mainRef.current.scrollTop = startPos.current.scrollTop - dy;
      }
    };

    const handleWindowMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setIsGrabbing(false);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  const handleClickCapture = (e: React.MouseEvent) => {
    // Si el usuario arrastró más de 6px, suprimir el clic para evitar abrir/cerrar partidos por accidente
    if (dragDistance.current > 6) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Determinar el partido activo para el panel de detalles (prioridad: click > hover)
  const activeMatchId = selectedMatchId || hoveredMatchId;
  const activeMatchData = useMemo(() => {
    return partidos.find((p) => p.id === activeMatchId) || null;
  }, [partidos, activeMatchId]);

  const scrollToMatch = useCallback((matchId: string) => {
    const element = document.getElementById(`match-${matchId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setSelectedMatchId(matchId);
    }
  }, []);


  const fetchData = async () => {
    if (bracketsCache) {
      setPartidos(bracketsCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: matchesData, error } = await fetchWithRetry(() =>
        supabase.from('matches').select(`
          *,
          team_1_score,
          team_2_score,
          team_1:teams!team_1_id (
            id, name, logo_url, seed,
            players (nickname, avatar_url, osu_id)
          ),
          team_2:teams!team_2_id (
            id, name, logo_url, seed,
            players (nickname, avatar_url, osu_id)
          ),
          results:match_map_results (map_winner_id),
          lobbies (
            id,
            status,
            match_time,
            lobby_link, 
            referee:staff!referee_id (nickname),
            streamer:staff!streamer_id (nickname),
            caster_1:staff!caster_1_id (nickname),
            caster_2:staff!caster_2_id (nickname)
          )
        `)
      );

      if (error) throw error;
      const list = (matchesData as Match[]) || [];
      bracketsCache = list;
      setPartidos(list);
    } catch (error) {
      console.error('Error cargando la CNARG:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Brackets | CNARG 4K 2026';
    fetchData();
  }, []);

  // Agrupamiento indexado de partidos por clave "bracket:stage" para evitar filtros en cada render
  const matchesMap = useMemo(() => {
    const map: Record<string, Match[]> = {};
    partidos.forEach((p) => {
      const key = `${p.bracket_group?.toLowerCase()}:${p.stage}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    // Ordenar cada grupo por fila visual en la grilla (MANUAL_POSITIONS)
    Object.values(map).forEach((list) => {
      list.sort((a, b) => {
        const rowA = MANUAL_POSITIONS[a.match_order]?.row ?? (a.match_order || 0);
        const rowB = MANUAL_POSITIONS[b.match_order]?.row ?? (b.match_order || 0);
        return rowA - rowB;
      });
    });

    return map;
  }, [partidos]);

  const getGridPosition = (roundIndex: number, matchIndex: number, matchOrder: number) => {
    const manual = MANUAL_POSITIONS[matchOrder];
    if (manual) {
      return { gridColumn: roundIndex + 1, gridRow: `${manual.row} / span ${manual.span}` };
    }
    const span = Math.pow(2, roundIndex + 1);
    const start = Math.pow(2, roundIndex) + matchIndex * Math.pow(2, roundIndex + 1);
    return { gridColumn: roundIndex + 1, gridRow: `${start} / span ${span}` };
  };

  const renderBracketSection = (
    bracketType: 'winners' | 'losers',
    stages: string[],
    color: string,
    sectionId: string
  ) => (
    <div id={sectionId} className="flex flex-col mb-28 sm:mb-40 scroll-mt-24">
      <div className="ml-4 sm:ml-10 mb-6 sm:mb-10 border-l-4 pl-4 sm:pl-6 flex items-center justify-between" style={{ borderColor: color }}>
        <h2 className="font-['ITCMachine'] text-2xl sm:text-4xl text-white uppercase tracking-widest">
          {bracketType} Bracket
        </h2>
      </div>

      <div
        className="grid gap-x-32 px-4 sm:px-8 auto-rows-[100px]"
        style={{ gridTemplateColumns: `repeat(${stages.length}, 300px)` }}
      >
        {stages.map((stageTitle, roundIndex) => {
          const key = `${bracketType}:${stageTitle}`;
          const stageMatches = matchesMap[key] || [];

          return (
            <React.Fragment key={stageTitle}>
              {/* Títulos estáticos */}
              <div
                className="mb-8 bg-[#2e2e2e] py-2 shadow-lg shadow-black/20"
                style={{ gridColumn: roundIndex + 1, gridRow: '1' }}
              >
                <h3
                  className="w-full text-center font-['ITCMachine'] bg-black/40 py-4 text-xl tracking-widest uppercase border-b-2"
                  style={{ color, borderColor: color }}
                >
                  {stageTitle}
                </h3>
              </div>

              {stageMatches.map((match, matchIndex) => {
                const position = getGridPosition(roundIndex, matchIndex, match.match_order);
                const connectorConfig = MANUAL_CONNECTORS[match.match_order] || { type: 'straight' };

                const lobby = getSafeLobby(match);
                const isWBD = lobby?.status?.toLowerCase() === 'wbd';
                const isHighlighted =
                  hoveredMatchId === match.id ||
                  (Boolean(hoveredTeamName) &&
                    (match.team_1?.name === hoveredTeamName || match.team_2?.name === hoveredTeamName));
                const isSelected = selectedMatchId === match.id;

                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-center w-full"
                    style={{
                      gridColumn: position.gridColumn,
                      gridRow: position.gridRow,
                      marginTop: '40px',
                    }}
                  >
                    <MatchCard
                      match={match}
                      isHighlighted={isHighlighted}
                      isSelected={isSelected}
                      onMouseEnter={() => setHoveredMatchId(match.id)}
                      onMouseLeave={() => {
                        setHoveredMatchId(null);
                        setHoveredTeamName(null);
                      }}
                      onClick={() => {
                        setSelectedMatchId((prev) => (prev === match.id ? null : match.id));
                      }}
                      onTeamHover={setHoveredTeamName}
                      showConnector={roundIndex < stages.length - 1}
                      connectorType={connectorConfig.type}
                      connectorStep={connectorConfig.step || 1}
                      isLosers={bracketType === 'losers'}
                      placeholder1={LOSER_PLACEHOLDERS[match.match_order]?.p1}
                      placeholder2={LOSER_PLACEHOLDERS[match.match_order]?.p2}
                      isWBD={isWBD}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingScreen message="CARGANDO BRACKETS..." />;
  }

  return (
    <div className="fixed top-[80px] bottom-0 md:bottom-12 left-0 right-0 w-full flex flex-col bg-[#2e2e2e] overflow-hidden select-none animate-fadeIn">
      <div className="flex flex-1 h-full overflow-hidden relative">
        <MatchHistorySidebar
          matches={partidos}
          activeId={activeMatchId}
          onHover={setHoveredMatchId}
          onMatchClick={scrollToMatch}
        />

        <MatchDetailPanel
          match={activeMatchData}
          isPinned={Boolean(selectedMatchId)}
          onClose={() => setSelectedMatchId(null)}
        />

        <section
          ref={mainRef}
          aria-label="Cuadro interactivo de brackets"
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className={`flex-1 h-full overflow-auto p-4 sm:p-8 pb-32 md:pb-20 custom-scrollbar ${
            isGrabbing ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
        >
          {/* Header con título */}
          <div className="ml-4 sm:ml-10 mb-8 sm:mb-12">
            <h1 className="font-['ITCMachine'] text-4xl sm:text-6xl md:text-8xl lg:text-[100px] uppercase text-white leading-none text-shadow-lg">
              BRACKETS
            </h1>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">
              Arrastra con clic izquierdo para explorar • Clic en un partido para fijar detalles
            </p>
            {/* Mensaje de ayuda táctil en celular */}
            <div className="md:hidden inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-[#fdc15a]/10 border border-[#fdc15a]/20 text-[#fdc15a] text-xs font-mono">
              <span>Desliza con el dedo para ver las rondas</span>
            </div>
          </div>

          {renderBracketSection('winners', WINNERS_STAGES, '#fdc15a', 'winners-bracket')}

          <div className="h-[2px] bg-white/5 w-full my-20 sm:my-28" />

          {renderBracketSection('losers', LOSERS_STAGES, '#67a4da', 'losers-bracket')}
        </section>
      </div>
    </div>
  );
}