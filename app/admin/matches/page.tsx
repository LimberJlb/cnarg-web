'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BracketSeeding() {
  const [teams, setTeams] = useState<any[]>([]);
  const [initialMatches, setInitialMatches] = useState<any[]>([]);

  const loadInitialRound = async () => {
    const [tRes, mRes] = await Promise.all([
      supabase.from('teams').select('id, name'),
      // Solo traemos la primera ronda del Winners Bracket
      supabase.from('matches')
        .select('*')
        .eq('stage', 'ROUND OF 16')
        .eq('bracket_group', 'winners')
        .order('match_order', { ascending: true })
    ]);
    setTeams(tRes.data || []);
    setInitialMatches(mRes.data || []);
  };

  useEffect(() => { loadInitialRound(); }, []);

  const updateMatchTeams = async (matchId: string, team1Id: string | null, team2Id: string | null) => {
    const { error } = await supabase
      .from('matches')
      .update({ team_1_id: team1Id, team_2_id: team2Id })
      .eq('id', matchId);
    
    if (error) alert("Error al sembrar equipos: " + error.message);
    else loadInitialRound();
  };

  return (
    <div className="p-10 bg-[#121212] min-h-screen text-white">
      <h1 className="text-[#fdc15a] font-['ITCMachine'] text-4xl mb-10">CNARG: SEEDING INICIAL</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialMatches.map((m, index) => (
          <div key={m.id} className="bg-[#1a1a1a] p-6 border border-white/10 rounded-xl">
            <h3 className="text-[#fdc15a] text-xs font-black mb-4 uppercase">Match #{m.match_order} - {m.stage}</h3>
            <div className="space-y-4">
              <select 
                className="bg-black w-full p-3 rounded border border-white/10 text-sm"
                value={m.team_1_id || ''}
                onChange={(e) => updateMatchTeams(m.id, e.target.value || null, m.team_2_id)}
              >
                <option value="">Seleccionar Equipo 1</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <div className="text-center text-gray-600 font-bold">VS</div>

              <select 
                className="bg-black w-full p-3 rounded border border-white/10 text-sm"
                value={m.team_2_id || ''}
                onChange={(e) => updateMatchTeams(m.id, m.team_1_id, e.target.value || null)}
              >
                <option value="">Seleccionar Equipo 2</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}