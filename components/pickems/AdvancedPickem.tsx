'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

interface AdvancedPickemProps {
  match: any;
  userId: string;
  onAdvance?: (winnerTeam: any, targetMatchId: string, targetSlot: number) => void;
}

const LIMITS = { BANS_PER_TEAM: 1, PROTECTS_PER_TEAM: 1, MAX_WINS: 7 };
const EMPTY_TEAM_LOGO = '/no-logo.png'; 

const MOD_NAMES: Record<string, string> = {
  'RC': 'RICE', 'HB': 'HYBRID', 'LN': 'LONG NOTE', 'SV': 'SLIDER VELOCITY', 'TB': 'TIEBREAKER'
};
const MOD_ORDER = ['RC', 'HB', 'LN', 'SV', 'TB'];

type MapState = {
  ban?: 'T1' | 'T2' | null;
  shield?: 'T1' | 'T2' | null;
  win?: 'T1' | 'T2' | null;
  skip?: boolean;
};

const getModColor = (mod: string) => {
  switch (mod) {
    case 'RC': return 'bg-[#70ade3]/20 text-[#70ade3] border-[#70ade3]/30'; 
    case 'LN': return 'bg-[#ff4d4d]/20 text-[#ff4d4d] border-[#ff4d4d]/30'; 
    case 'HB': return 'bg-[#ff9933]/20 text-[#ff9933] border-[#ff9933]/30'; 
    case 'SV': return 'bg-[#008000]/20 text-[#008000] border-[#008000]/30'; 
    case 'TB': return 'bg-[#800080]/20 text-[#800080] border-[#800080]/30';     
    default: return 'bg-white/10 text-white border-white/20';
  }
};

export default function AdvancedPickem({ match, userId, onAdvance }: AdvancedPickemProps) {
  if (!match?.id) return <div className="p-8 text-zinc-800 text-[10px] font-black uppercase animate-pulse">Sincronizando...</div>;

  const [mappool, setMappool] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, MapState>>({});
  const [overallWinner, setOverallWinner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Contador de puntos
  const scores = useMemo(() => {
    const values = Object.values(selections);
    return {
      T1: values.filter(s => s.win === 'T1').length,
      T2: values.filter(s => s.win === 'T2').length
    };
  }, [selections]);

  // 🔴 LÓGICA DE GANADOR AUTOMÁTICO (AUTO-WIN)
  useEffect(() => {
    if (isLocked) return;

    if (scores.T1 === LIMITS.MAX_WINS) {
      setOverallWinner(match.team_1_id);
      if (onAdvance && match.winner_to_match_id && match.team_1) {
        onAdvance(match.team_1, match.winner_to_match_id, match.winner_to_slot);
      }
    } else if (scores.T2 === LIMITS.MAX_WINS) {
      setOverallWinner(match.team_2_id);
      if (onAdvance && match.winner_to_match_id && match.team_2) {
        onAdvance(match.team_2, match.winner_to_match_id, match.winner_to_slot);
      }
    } else {
      // Si bajan de los 7 puntos (ej: desmarcan un pick), quitamos el ganador general
      setOverallWinner(null);
    }
  }, [scores, match.team_1, match.team_2, isLocked]);

  // Validación de pool completo
  const isMappoolComplete = useMemo(() => {
    if (mappool.length === 0) return false;
    return mappool.every(map => {
      const s = selections[map.id];
      return s && (s.ban || s.shield || s.win || s.skip);
    });
  }, [mappool, selections]);

  useEffect(() => {
    const loadData = async () => {
      const stageBase = match.stage.split(' R')[0].trim();
      const { data: stageData } = await supabase.from('stages').select('id').eq('name', stageBase).single();

      if (stageData) {
        const { data: maps } = await supabase.from('mappool_maps').select('*').eq('stage_id', stageData.id).order('pattern_type', { ascending: true }).order('slot', { ascending: true });
        setMappool(maps || []);
      }

      const { data: pred } = await supabase.from('predictions_advanced').select('*').eq('match_id', match.id).eq('user_id', userId).single();

      if (pred) {
        const initial: Record<string, MapState> = {};
        if (pred.map_wins) {
          Object.entries(pred.map_wins).forEach(([id, teamId]) => {
            if (id === 'OVERALL') {
              setOverallWinner(teamId as string);
              if (onAdvance && match.winner_to_match_id) {
                const winnerObj = teamId === match.team_1_id ? match.team_1 : match.team_2;
                if (winnerObj) onAdvance(winnerObj, match.winner_to_match_id, match.winner_to_slot);
              }
            } else {
              if (!initial[id]) initial[id] = {};
              initial[id].win = teamId === match.team_1_id ? 'T1' : 'T2';
            }
          });
        }
        if (pred.map_bans && !Array.isArray(pred.map_bans)) {
          Object.entries(pred.map_bans).forEach(([id, teamId]) => {
            if (!initial[id]) initial[id] = {};
            initial[id].ban = teamId === match.team_1_id ? 'T1' : 'T2';
          });
        }
        if (pred.map_protects && !Array.isArray(pred.map_protects)) {
          Object.entries(pred.map_protects).forEach(([id, teamId]) => {
            if (!initial[id]) initial[id] = {};
            initial[id].shield = teamId === match.team_1_id ? 'T1' : 'T2';
          });
        }
        if (pred.map_not_played) {
          const skipArray = Array.isArray(pred.map_not_played) ? pred.map_not_played : [pred.map_not_played];
          skipArray.forEach((id: string) => {
            if (!initial[id]) initial[id] = {};
            initial[id].skip = true;
          });
        }
        setSelections(initial);
        setIsLocked(true);
      }
    };
    loadData();
  }, [match.id, userId, match.team_1_id, match.team_2_id]);

  // Mantenemos la función manual por si acaso, pero el useEffect hará el trabajo pesado
  const handleSelectWinner = (teamId: string, teamObj: any) => {
    if (isLocked || !teamId) return;
    setOverallWinner(teamId);
    if (match.winner_to_match_id && match.winner_to_slot && onAdvance) {
      onAdvance(teamObj, match.winner_to_match_id, match.winner_to_slot);
    }
  };

  const handleAction = (mapId: string, actionType: 'ban' | 'shield' | 'win', team: 'T1' | 'T2') => {
    if (isLocked) return;
    setSelections(prev => {
      const current = prev[mapId] || {};
      const newState = { ...current };
      if (actionType === 'win') {
        const currentWins = Object.values(prev).filter(s => s.win === team).length;
        if (newState.win !== team && currentWins >= LIMITS.MAX_WINS) return prev; 
        newState.win = newState.win === team ? null : team;
        if (newState.win) { newState.ban = null; newState.skip = false; }
      } 
      else if (actionType === 'ban') {
        const bansByTeam = Object.values(prev).filter(s => s.ban === team).length;
        if (newState.ban !== team && bansByTeam >= LIMITS.BANS_PER_TEAM) return prev; 
        newState.ban = newState.ban === team ? null : team;
        if (newState.ban) { newState.shield = null; newState.win = null; newState.skip = false; }
      } 
      else if (actionType === 'shield') {
        const shieldsByTeam = Object.values(prev).filter(s => s.shield === team).length;
        if (newState.shield !== team && shieldsByTeam >= LIMITS.PROTECTS_PER_TEAM) return prev; 
        newState.shield = newState.shield === team ? null : team;
        if (newState.shield) { newState.ban = null; }
      }
      return { ...prev, [mapId]: newState };
    });
  };

  const handleSkip = (mapId: string) => {
    if (isLocked) return;
    setSelections(prev => {
      const current = prev[mapId] || {};
      if (current.skip) return { ...prev, [mapId]: { ...current, skip: false } };
      return { ...prev, [mapId]: { ...current, skip: true, ban: null, win: null } };
    });
  };

  const handleFinalSave = async () => {
    if (!overallWinner) return alert("El ganador debe tener 7 puntos.");
    if (!isMappoolComplete) return alert("Faltan casillas por marcar.");
    
    setIsSaving(true);
    const map_wins: Record<string, string> = { 'OVERALL': overallWinner };
    const map_bans: Record<string, string> = {};
    const map_protects: Record<string, string> = {};
    let map_not_played: string[] = []; 

    Object.entries(selections).forEach(([id, state]) => {
      if (state.ban) map_bans[id] = state.ban === 'T1' ? match.team_1_id : match.team_2_id;
      if (state.shield) map_protects[id] = state.shield === 'T1' ? match.team_1_id : match.team_2_id;
      if (state.win) map_wins[id] = state.win === 'T1' ? match.team_1_id : match.team_2_id;
      if (state.skip) map_not_played.push(id);
    });

    const { error } = await supabase.from('predictions_advanced').insert({
      user_id: userId, match_id: match.id, map_wins, map_bans, map_protects, map_not_played 
    });

    if (!error) { setIsLocked(true); setShowConfirm(false); } 
    else alert("Error al guardar.");
    setIsSaving(false);
  };

  const groupedMappool = useMemo(() => {
    const groups = mappool.reduce((acc, map) => {
      const type = map.pattern_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(map);
      return acc;
    }, {} as Record<string, any[]>);
    return Object.keys(groups).sort((a, b) => {
      const indexA = MOD_ORDER.indexOf(a);
      const indexB = MOD_ORDER.indexOf(b);
      return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99);
    }).map(key => ({ mod: key, maps: groups[key] }));
  }, [mappool]);

  const getStatusBadge = (state: MapState) => {
    if (state?.skip) return { text: 'SKIPPED', color: 'bg-zinc-600 text-white border-zinc-500' };
    if (state?.win === 'T1') return { text: 'T1 WIN', color: 'bg-[#fdc15a] text-black border-[#fdc15a]' };
    if (state?.win === 'T2') return { text: 'T2 WIN', color: 'bg-[#67a4da] text-black border-[#67a4da]' };
    if (state?.ban) return { text: `${state.ban} BAN`, color: 'bg-red-500 text-white border-red-400' };
    if (state?.shield) return { text: `${state.shield} PROT`, color: 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' };
    return { text: 'WAITING', color: 'text-zinc-400 border-white/10 bg-black/50' };
  };

  return (
    <div className={`flex flex-col transition-all ${isLocked ? 'opacity-80' : ''}`}>
      
      {/* CABECERA SCOREBOARD ( Banner ahora reacciona a los puntos ) */}
      <div className="flex flex-col md:flex-row border-b border-white/10 relative bg-white/[0.02]">
        
        {/* EQUIPO 1 */}
        <div className={`flex-1 flex items-center justify-start gap-6 p-8 transition-all duration-300 relative overflow-hidden group outline-none text-left ${overallWinner === match.team_1_id ? 'bg-[#fdc15a]/10' : ''}`}>
          {overallWinner === match.team_1_id && <div className="absolute left-0 top-0 w-2 h-full bg-[#fdc15a] shadow-[0_0_20px_rgba(253,193,90,0.8)]"></div>}
          <div className={`w-20 h-20 xl:w-28 xl:h-28 bg-white/5 border-2 p-0.5 rounded-sm overflow-hidden shrink-0 transition-all duration-300 relative z-10 ${overallWinner === match.team_1_id ? 'border-[#fdc15a]' : 'border-white/10'}`}>
            <img src={match.team_1?.logo_url || EMPTY_TEAM_LOGO} className="w-full h-full object-cover" alt="T1"/>
          </div>
          <div className="flex flex-col items-start relative z-10">
            <div className="flex items-baseline gap-4">
              <span className={`text-2xl xl:text-4xl font-black uppercase tracking-tighter transition-colors ${overallWinner === match.team_1_id ? 'text-[#fdc15a]' : 'text-white'}`}>{match.team_1?.name || 'TBA'}</span>
              <span className={`font-['ITCMachine'] text-4xl xl:text-6xl ${scores.T1 > 0 ? 'text-[#fdc15a] drop-shadow-[0_0_10px_rgba(253,193,90,0.4)]' : 'text-white/10'}`}>{scores.T1}</span>
            </div>
            {overallWinner === match.team_1_id && <span className="text-[9px] font-black text-[#fdc15a] uppercase tracking-widest mt-1">Ganador del Encuentro ✨</span>}
          </div>
        </div>
        
        {/* VS */}
        <div className="flex flex-col items-center justify-center px-6 bg-[#0a0a0a] z-10 relative border-y md:border-y-0 md:border-x border-white/5">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-2 px-3 py-1 bg-white/5 rounded-sm">{match.stage}</span>
          <span className="font-['ITCMachine'] text-5xl text-zinc-700 italic select-none">VS</span>
        </div>
        
        {/* EQUIPO 2 */}
        <div className={`flex-1 flex items-center justify-end gap-6 p-8 transition-all duration-300 relative overflow-hidden group outline-none text-right ${overallWinner === match.team_2_id ? 'bg-[#67a4da]/10' : ''}`}>
          {overallWinner === match.team_2_id && <div className="absolute right-0 top-0 w-2 h-full bg-[#67a4da] shadow-[0_0_20px_rgba(103,164,218,0.8)]"></div>}
          <div className="flex flex-col items-end relative z-10">
            <div className="flex items-baseline gap-4">
              <span className={`font-['ITCMachine'] text-4xl xl:text-6xl ${scores.T2 > 0 ? 'text-[#67a4da] drop-shadow-[0_0_10px_rgba(103,164,218,0.4)]' : 'text-white/10'}`}>{scores.T2}</span>
              <span className={`text-2xl xl:text-4xl font-black uppercase tracking-tighter transition-colors ${overallWinner === match.team_2_id ? 'text-[#67a4da]' : 'text-white'}`}>{match.team_2?.name || 'TBA'}</span>
            </div>
            {overallWinner === match.team_2_id && <span className="text-[9px] font-black text-[#67a4da] uppercase tracking-widest mt-1">Ganador del Encuentro ✨</span>}
          </div>
          <div className={`w-20 h-20 xl:w-28 xl:h-28 bg-white/5 border-2 p-0.5 rounded-sm overflow-hidden shrink-0 transition-all duration-300 relative z-10 ${overallWinner === match.team_2_id ? 'border-[#67a4da]' : 'border-white/10'}`}>
            <img src={match.team_2?.logo_url || EMPTY_TEAM_LOGO} className="w-full h-full object-cover" alt="T2"/>
          </div>
        </div>
      </div>

      {/* POOL Y FOOTER */}
      <div className="p-6 bg-[#0a0a0a]">
        {groupedMappool.map((group) => (
          <div key={group.mod} className="mb-8 last:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <span className={`font-black text-[13px] tracking-[0.3em] uppercase ${group.mod === 'TB' ? 'text-[#800080]' : 'text-zinc-400'}`}>{MOD_NAMES[group.mod] || group.mod} POOL</span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.maps.map((map: any) => {
                const sel = selections[map.id] || {};
                const badgeStatus = getStatusBadge(sel);
                let cardBorder = 'border-white/10 hover:border-white/30';
                if (sel.skip) cardBorder = 'border-zinc-500 shadow-[0_0_15px_rgba(113,113,122,0.3)]';
                else if (sel.win === 'T1') cardBorder = 'border-[#fdc15a] shadow-[0_0_15px_rgba(253,193,90,0.15)]';
                else if (sel.win === 'T2') cardBorder = 'border-[#67a4da] shadow-[0_0_15px_rgba(103,164,218,0.15)]';
                else if (sel.ban) cardBorder = 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
                else if (sel.shield) cardBorder = 'border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)]';

                return (
                  <div key={map.id} className={`relative p-3.5 flex flex-col gap-4 rounded-sm transition-all overflow-hidden border bg-[#111] ${cardBorder}`}>
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      <div className="absolute inset-0 bg-black/50 z-10"></div>
                      {map.banner_id && <img src={`https://assets.ppy.sh/beatmaps/${map.banner_id}/covers/cover.jpg`} className="w-full h-full object-cover blur-[2px] opacity-40 scale-110" alt="" />}
                    </div>
                    <div className="relative z-10 flex flex-col h-full gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={`font-black text-[10px] px-2 py-1 rounded-sm shrink-0 shadow-md border ${getModColor(map.pattern_type)}`}>{map.pattern_type}{map.slot}</span>
                          <span className="text-xs font-bold text-white truncate w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{map.title}</span>
                        </div>
                        <div className={`text-[9px] font-black px-2 py-1 rounded-sm border shrink-0 transition-colors ${badgeStatus.color}`}>{badgeStatus.text}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 w-full mt-auto">
                        <DualAction label="BAN" activeTeam={sel.ban} onSelect={(t: any) => handleAction(map.id, 'ban', t)} disabled={isLocked || map.pattern_type === 'TB'} />
                        <DualAction label="PROT" activeTeam={sel.shield} onSelect={(t: any) => handleAction(map.id, 'shield', t)} disabled={isLocked} />
                        <DualAction label="WIN" activeTeam={sel.win} onSelect={(t: any) => handleAction(map.id, 'win', t)} disabled={isLocked} />
                        <button onClick={() => handleSkip(map.id)} disabled={isLocked} className={`py-1.5 text-[9px] xl:text-[10px] font-black uppercase rounded-sm border transition-all ${sel.skip ? 'bg-zinc-600 text-white border-zinc-600 shadow-md' : 'bg-black/60 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'}`}>SKIP</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!isLocked ? (
        <div className="flex flex-col gap-4">
          {!isMappoolComplete && (
            <div className="mx-6 p-4 bg-red-600/10 border border-red-600/20 rounded-sm flex items-center justify-center gap-3 animate-pulse">
              <span className="text-red-500 font-black text-[11px] uppercase tracking-[0.2em]">⚠️ Faltan casillas por marcar en el Mappool</span>
            </div>
          )}
          {isMappoolComplete && !overallWinner && (
            <div className="mx-6 p-4 bg-orange-600/10 border border-orange-600/20 rounded-sm flex items-center justify-center gap-3">
              <span className="text-orange-500 font-black text-[11px] uppercase tracking-[0.2em]">⚠️ Algún equipo debe llegar a 7 victorias</span>
            </div>
          )}

          {!showConfirm ? (
            <button 
              disabled={!isMappoolComplete || !overallWinner}
              onClick={() => setShowConfirm(true)} 
              className={`w-full py-5 font-black uppercase tracking-widest text-[11px] transition-all ${(!isMappoolComplete || !overallWinner) ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-[#67a4da] text-white hover:bg-white hover:text-black'}`}
            >
              Confirmar Draft Definitivo
            </button>
          ) : (
            <div className="bg-red-600/10 border-t border-red-600/20 p-5">
              <p className="text-[10px] text-red-500 font-black text-center mb-3 uppercase tracking-tighter">⚠️ Acción Irreversible. ¿Estás seguro?</p>
              <div className="flex gap-2 justify-center max-w-md mx-auto">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-zinc-800 text-white font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                <button onClick={handleFinalSave} disabled={isSaving} className="flex-1 py-3 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest">Confirmar</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-5 text-center bg-[#67a4da]/5 border-t border-[#67a4da]/20">
          <span className="text-[#67a4da] font-black text-[11px] uppercase tracking-[0.3em]">Draft Confirmado y Bloqueado 🔒</span>
        </div>
      )}
    </div>
  );
}

function DualAction({ label, activeTeam, onSelect, disabled }: any) {
  return (
    <div className="flex w-full border border-white/10 rounded-sm overflow-hidden bg-black/60 shadow-inner">
      <div className="w-[35%] flex items-center justify-center bg-white/5 border-r border-white/10">
        <span className="text-[8px] xl:text-[9px] font-black uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <button disabled={disabled} onClick={() => onSelect('T1')} className={`flex-1 py-1.5 text-[9px] xl:text-[10px] font-black transition-all z-10 ${activeTeam === 'T1' ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_rgba(253,193,90,0.5)]' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>T1</button>
      <div className="w-px bg-white/10"></div>
      <button disabled={disabled} onClick={() => onSelect('T2')} className={`flex-1 py-1.5 text-[9px] xl:text-[10px] font-black transition-all z-10 ${activeTeam === 'T2' ? 'bg-[#67a4da] text-black shadow-[0_0_10px_rgba(103,164,218,0.5)]' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>T2</button>
    </div>
  );
}