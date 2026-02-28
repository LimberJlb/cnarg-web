'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminLobbies() {
  const [matches, setMatches] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [staffRes, matchesRes] = await Promise.all([
        // 1. Traemos nickname y roles específicamente
        supabase.from('staff').select('id, nickname, roles'),
        supabase.from('matches').select(`
          id, stage, team_1_id, team_2_id,
          team_1:team_1_id(name),
          team_2:team_2_id(name),
          lobbies(*)
        `)
        .not('team_1_id', 'is', null)
        .not('team_2_id', 'is', null)
      ]);

      setStaff(staffRes.data || []);
      setMatches(matchesRes.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  // Función para filtrar staff por rol (asumiendo que roles es un string o array)
  const getStaffByRole = (roleName: string) => {
    return staff.filter(s => 
      s.roles?.toString().toLowerCase().includes(roleName.toLowerCase())
    );
  };

  const handleUpdateLobby = async (matchId: string, updates: any) => {
    const { error } = await supabase
      .from('lobbies')
      .upsert({ match_id: matchId, ...updates }, { onConflict: 'match_id' });
    
    if (error) console.error("Error:", error.message);
  };

  if (loading) return <div className="p-10 text-white font-['ITCMachine'] animate-pulse text-2xl">CARGANDO STAFF...</div>;

  return (
    <div className="p-8 bg-[#121212] min-h-screen text-white">
      <h1 className="text-[#fdc15a] font-['ITCMachine'] text-4xl mb-8 uppercase tracking-widest">
        Logística de Lobbies
      </h1>
      
      <div className="flex flex-col gap-6">
        {matches.map((m) => {
          const lobby = m.lobbies?.[0] || {};
          return (
            <div key={m.id} className="bg-zinc-900/50 border border-white/5 p-6 rounded-xl flex flex-col md:flex-row gap-8 items-center">
              
              {/* Info del Encuentro */}
              <div className="w-full md:w-1/4">
                <span className="text-zinc-500 text-[10px] font-black uppercase">{m.stage}</span>
                <h3 className="text-lg font-bold text-white">
                  {m.team_1?.name} <span className="text-[#fdc15a] mx-1">VS</span> {m.team_2?.name}
                </h3>
              </div>

              {/* Horario y Referee */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold">Horario (ARG)</label>
                  <input 
                    type="datetime-local"
                    className="bg-black border border-white/10 p-2 rounded text-sm text-white focus:border-[#fdc15a] outline-none"
                    defaultValue={lobby.match_time ? new Date(lobby.match_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleUpdateLobby(m.id, { match_time: e.target.value })}
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold">Referee</label>
                  <select 
                    className="bg-black border border-white/10 p-2 rounded text-sm"
                    defaultValue={lobby.referee_id || ''}
                    onChange={(e) => handleUpdateLobby(m.id, { referee_id: e.target.value })}
                  >
                    <option value="">Seleccionar Referee</option>
                    {getStaffByRole('Referee').map(s => (
                      <option key={s.id} value={s.id}>{s.nickname}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transmisión y Casters */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold">Streamer</label>
                  <select 
                    className="bg-black border border-white/10 p-2 rounded text-sm"
                    defaultValue={lobby.streamer_id || ''}
                    onChange={(e) => handleUpdateLobby(m.id, { streamer_id: e.target.value })}
                  >
                    <option value="">Seleccionar Streamer</option>
                    {getStaffByRole('Streamer').map(s => (
                      <option key={s.id} value={s.id}>{s.nickname}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold">Caster 1</label>
                  <select 
                    className="bg-black border border-white/10 p-2 rounded text-sm"
                    defaultValue={lobby.caster_1_id || ''}
                    onChange={(e) => handleUpdateLobby(m.id, { caster_1_id: e.target.value })}
                  >
                    <option value="">Sin asignar</option>
                    {getStaffByRole('Caster').map(s => (
                      <option key={s.id} value={s.id}>{s.nickname}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold">Caster 2</label>
                  <select 
                    className="bg-black border border-white/10 p-2 rounded text-sm"
                    defaultValue={lobby.caster_2_id || ''}
                    onChange={(e) => handleUpdateLobby(m.id, { caster_2_id: e.target.value })}
                  >
                    <option value="">Sin asignar</option>
                    {getStaffByRole('Caster').map(s => (
                      <option key={s.id} value={s.id}>{s.nickname}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}