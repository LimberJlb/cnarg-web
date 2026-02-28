'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MatchFormData {
  team_1_id: string | null; team_2_id: string | null;
  stage: string; bracket_group: string; match_order: number;
  next_match_id: string | null; is_next_match_team_1: boolean;
  loser_next_match_id: string | null; is_loser_next_match_team_1: boolean;
}

export default function MatchManager() {
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);

  // Formulario de creación (Estado actual)
  const [formData, setFormData] = useState<MatchFormData>({
    team_1_id: null, team_2_id: null, stage: 'ROUND OF 16', bracket_group: 'winners', 
    match_order: 1, next_match_id: null, is_next_match_team_1: true,
    loser_next_match_id: null, is_loser_next_match_team_1: true
  });

  const loadData = async () => {
    const [tRes, mRes] = await Promise.all([
      supabase.from('teams').select('id, name'),
      supabase.from('matches').select(`
        *,
        team_1:team_1_id(name),
        team_2:team_2_id(name),
        lobbies(id, osu_match_id, status)
      `).order('created_at', { ascending: false })
    ]);
    setTeams(tRes.data || []);
    setMatches(mRes.data || []);
  };

  useEffect(() => { loadData(); }, []);

  // --- LÓGICA DE IMPORTACIÓN ---
  const handleImport = async (matchId: string, osuMatchId: string | null) => {
    const finalOsuId = osuMatchId || prompt("Pega el ID del lobby de osu! (ej: 11223344)");
    if (!finalOsuId) return;

    setImporting(matchId);
    try {
      const res = await fetch('/api/match-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: finalOsuId, internalMatchId: matchId, mode: 'MATCH' })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`¡Importación exitosa! ${data.count} mapas cargados.`);
        // Actualizamos o creamos el lobby como 'finished'
        await supabase.from('lobbies').upsert({ 
          match_id: matchId, 
          osu_match_id: finalOsuId, 
          status: 'finished' 
        }, { onConflict: 'match_id' });
        loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Error de conexión con la API.");
    } finally {
      setImporting(null);
    }
  };

  const handleCreate = async () => {
    const { error } = await supabase.from('matches').insert([formData]);
    if (error) alert(error.message);
    else { alert("Match registrado."); loadData(); }
  };

  return (
    <div className="p-10 bg-[#1a1a1a] min-h-screen text-white space-y-12">
      <h1 className="text-[#fdc15a] font-['ITCMachine'] text-4xl uppercase">Panel Admin CNARG</h1>

      {/* 1. SECCIÓN DE CREACIÓN (Tu grid de selects actual aquí) */}
      <div className="bg-black/40 p-8 border border-white/5 rounded-lg">
        <h3 className="text-[#fdc15a] text-xs font-black uppercase mb-4 tracking-widest">Crear Estructura de Match</h3>
        {/* ... (Inserción del formulario de creación anterior) ... */}
        <button onClick={handleCreate} className="w-full bg-[#fdc15a] text-black font-black py-4 mt-6 uppercase hover:bg-white transition-all">
          Guardar en Base de Datos
        </button>
      </div>

      {/* 2. GESTIÓN DE PARTIDOS E IMPORTACIÓN */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Partidos en el Bracket</h3>
        <div className="grid grid-cols-1 gap-2">
          {matches.map(m => (
            <div key={m.id} className="bg-black/60 p-4 border border-white/5 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-400">{m.stage}</span>
                <p className="font-bold">
                  {m.team_1?.name || 'TBD'} <span className="text-[#fdc15a]/50 mx-2">VS</span> {m.team_2?.name || 'TBD'}
                </p>
                {m.lobbies?.[0]?.osu_match_id && (
                  <span className="text-[10px] text-green-500 font-mono">ID: {m.lobbies[0].osu_match_id}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleImport(m.id, m.lobbies?.[0]?.osu_match_id)}
                  disabled={importing === m.id}
                  className={`text-[10px] font-black px-4 py-2 uppercase rounded transition-all ${
                    importing === m.id ? 'bg-gray-700 animate-pulse' : 'bg-white/5 hover:bg-[#fdc15a] hover:text-black'
                  }`}
                >
                  {importing === m.id ? 'Importando...' : 'Importar Scores'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}