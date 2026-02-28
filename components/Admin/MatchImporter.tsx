'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MatchImporter() {
  const [importMode, setImportMode] = useState<'MATCH' | 'QUALIFIERS'>('MATCH');
  const [matchUrl, setMatchUrl] = useState('');
  const [selectedInternalMatch, setSelectedInternalMatch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [internalMatches, setInternalMatches] = useState<any[]>([]);
  const [rondas, setRondas] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar datos iniciales de Supabase
  useEffect(() => {
    async function loadData() {
      const [mRes, sRes] = await Promise.all([
        supabase.from('matches').select('id, stage, team_1:team_1_id(name), team_2:team_2_id(name)').order('created_at', { ascending: false }),
        supabase.from('stages').select('*')
      ]);
      if (mRes.data) setInternalMatches(mRes.data);
      if (sRes.data) setRondas(sRes.data);
    }
    loadData();
  }, []);

  const handleFetchData = async () => {
    if (!matchUrl || (importMode === 'MATCH' && !selectedInternalMatch)) {
      alert("Por favor completa los campos requeridos.");
      return;
    }

    const matchId = matchUrl.split('/').pop();
    setLoading(true);
    setPreviewData(null); // Limpiar previas anteriores

    try {
      const res = await fetch('/api/osu/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId, 
          internalMatchId: selectedInternalMatch,
          mode: importMode 
        }),
      });
      const result = await res.json();

      if (result.success) {
        setPreviewData(result);
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Error al conectar con la API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    setSaving(true);
    try {
      // Decidir a qué tabla subir según el modo
      const table = importMode === 'QUALIFIERS' ? 'qualifier_scores' : 'match_map_results';
      
      const { error } = await supabase
        .from(table)
        .insert(previewData.data);

      if (error) throw error;

      alert(`¡Datos de ${importMode} guardados correctamente!`);
      setPreviewData(null);
      setMatchUrl('');
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-[#1a1a1a] p-8 border-l-4 border-[#fdc15a] shadow-xl">
        <h2 className="text-[#fdc15a] font-['ITCMachine'] text-3xl mb-6">PANEL DE REFEREE - CNARG</h2>
        
        {/* SWITCH DE MODO */}
        <div className="flex gap-2 mb-8 bg-black p-1 rounded-md border border-white/5">
          <button 
            onClick={() => { setImportMode('MATCH'); setPreviewData(null); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${importMode === 'MATCH' ? 'bg-[#fdc15a] text-black' : 'text-gray-500 hover:text-white'}`}
          >
            Match 1vs1
          </button>
          <button 
            onClick={() => { setImportMode('QUALIFIERS'); setPreviewData(null); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${importMode === 'QUALIFIERS' ? 'bg-[#fdc15a] text-black' : 'text-gray-500 hover:text-white'}`}
          >
            Qualifiers
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {importMode === 'MATCH' ? (
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">Seleccionar Partido</label>
              <select 
                className="w-full bg-black border border-white/10 p-3 text-white outline-none focus:border-[#fdc15a]"
                value={selectedInternalMatch}
                onChange={(e) => setSelectedInternalMatch(e.target.value)}
              >
                <option value="">-- Elige un partido --</option>
                {internalMatches.map((m) => (
                  <option key={m.id} value={m.id}>[{m.stage}] {m.team_1?.name} vs {m.team_2?.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">Info de Qualifiers</label>
              <div className="p-3 bg-black/50 border border-white/5 text-gray-500 text-sm">
                Se extraerán todos los scores individuales de la sala.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">Link de la Sala (MP)</label>
            <input 
              className="w-full bg-black border border-white/10 p-3 text-white outline-none focus:border-[#fdc15a]"
              placeholder="https://osu.ppy.sh/..."
              value={matchUrl}
              onChange={(e) => setMatchUrl(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={handleFetchData}
          disabled={loading}
          className="w-full bg-[#fdc15a] text-black font-black py-4 uppercase tracking-tighter hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? 'ANALIZANDO SALA...' : 'EXTRAER DATOS'}
        </button>
      </div>

      {/* PREVISUALIZACIÓN DE RESULTADOS */}
      {previewData && (
        <div className="bg-[#1a1a1a] border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-white/5 font-bold uppercase text-[10px] tracking-[0.2em] text-gray-500 flex justify-between">
            <span>Resultados Detectados ({previewData.count})</span>
            {importMode === 'QUALIFIERS' && <span className="text-[#fdc15a]">Modo Individual</span>}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {importMode === 'QUALIFIERS' ? (
              // --- TABLA DE QUALIFIERS ---
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-600 uppercase font-black border-b border-white/5">
                    <th className="p-4">Jugador ID</th>
                    <th className="p-4">Mapa ID</th>
                    <th className="p-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.data.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-mono text-gray-400">{item.player_id.slice(0,8)}...</td>
                      <td className="p-4 font-mono text-gray-400">{item.map_id.slice(0,8)}...</td>
                      <td className="p-4 text-right font-black text-[#fdc15a] text-lg">
                        {item.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // --- LISTA DE MATCH 1VS1 ---
              previewData.data.map((game: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Mapa {idx + 1}</span>
                  <div className="flex items-center gap-12">
                    <div className="text-center">
                      <div className="text-[10px] uppercase text-gray-600 mb-1">Score T1</div>
                      <div className={`font-black text-xl ${game.score_1 > game.score_2 ? 'text-[#fdc15a]' : 'text-white'}`}>{game.score_1.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase text-gray-600 mb-1">Score T2</div>
                      <div className={`font-black text-xl ${game.score_2 > game.score_1 ? 'text-[#fdc15a]' : 'text-white'}`}>{game.score_2.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={`px-4 py-1 rounded-sm text-[10px] font-black uppercase ${game.score_1 > game.score_2 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                    Win T{game.score_1 > game.score_2 ? '1' : '2'}
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={handleSaveResults}
            disabled={saving || previewData.data.length === 0}
            className="w-full bg-green-600 text-white font-black py-5 uppercase hover:bg-green-500 transition-colors disabled:opacity-50"
          >
            {saving ? 'GUARDANDO EN SUPABASE...' : 'CONFIRMAR Y SUBIR A LA WEB'}
          </button>
        </div>
      )}
    </div>
  );
}