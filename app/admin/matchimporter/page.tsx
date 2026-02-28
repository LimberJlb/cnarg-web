'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MatchImporterPage() {
  const [importMode, setImportMode] = useState<'MATCH' | 'QUALIFIERS'>('MATCH');
  const [matchUrl, setMatchUrl] = useState('');
  const [selectedInternalMatch, setSelectedInternalMatch] = useState('');
  const [selectedStage, setSelectedStage] = useState(''); // Para Qualifiers
  const [internalMatches, setInternalMatches] = useState<any[]>([]);
  const [rondas, setRondas] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      const [mRes, sRes] = await Promise.all([
        supabase.from('matches').select('id, stage, team_1:team_1_id(name), team_2:team_2_id(name)'),
        supabase.from('stages').select('*')
      ]);
      if (mRes.data) setInternalMatches(mRes.data);
      if (sRes.data) setRondas(sRes.data);
    }
    loadInitialData();
  }, []);

  const handleFetchData = async () => {
    // Si es modo MATCH, necesita el ID del partido. Si es QUALIFIERS, solo el stage.
    const internalId = importMode === 'MATCH' ? selectedInternalMatch : 'QUALIFIERS_MODE';
    
    if (!matchUrl || (importMode === 'MATCH' && !selectedInternalMatch) || (importMode === 'QUALIFIERS' && !selectedStage)) {
      alert("Faltan datos para la importación.");
      return;
    }

    const matchId = matchUrl.split('/').pop();
    setLoading(true);

    try {
      const res = await fetch('/api/osu/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId, 
          internalMatchId: internalId,
          mode: importMode,
          stageName: selectedStage
        }),
      });
      const result = await res.json();
      if (result.success) setPreviewData(result);
      else alert("Error: " + result.error);
    } catch (err) {
      alert("Error en la conexión.");
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#2e2e2e] p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#1a1a1a] p-8 border-l-4 border-[#fdc15a]">
          <h2 className="text-[#fdc15a] font-['ITCMachine'] text-3xl mb-6">IMPORTADOR DE RESULTADOS</h2>
          
          {/* SWITCH DE MODO */}
          <div className="flex gap-4 mb-8 bg-black/40 p-1 rounded-lg">
            <button 
              onClick={() => { setImportMode('MATCH'); setPreviewData(null); }}
              className={`flex-1 py-2 rounded-md font-bold text-xs uppercase transition-all ${importMode === 'MATCH' ? 'bg-[#fdc15a] text-black' : 'text-gray-500'}`}
            >
              Match 1vs1 (Brackets)
            </button>
            <button 
              onClick={() => { setImportMode('QUALIFIERS'); setPreviewData(null); }}
              className={`flex-1 py-2 rounded-md font-bold text-xs uppercase transition-all ${importMode === 'QUALIFIERS' ? 'bg-[#fdc15a] text-black' : 'text-gray-500'}`}
            >
              Lobby de Qualifiers
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {importMode === 'MATCH' ? (
              <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-2 font-black">Seleccionar Encuentro</label>
                <select 
                  className="w-full bg-black border border-white/10 p-3 text-white outline-none focus:border-[#fdc15a]"
                  value={selectedInternalMatch}
                  onChange={(e) => setSelectedInternalMatch(e.target.value)}
                >
                  <option value="">-- Elige el match --</option>
                  {internalMatches.map(m => (
                    <option key={m.id} value={m.id}>[{m.stage}] {m.team_1?.name} vs {m.team_2?.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-2 font-black">Seleccionar Etapa</label>
                <select 
                  className="w-full bg-black border border-white/10 p-3 text-white outline-none focus:border-[#fdc15a]"
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                >
                  <option value="">-- Elige la etapa --</option>
                  {rondas.filter(r => r.name.includes('QUALIFIERS')).map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase text-gray-500 mb-2 font-black">Link de la Sala (MP)</label>
              <input 
                className="w-full bg-black border border-white/10 p-3 text-white outline-none focus:border-[#fdc15a]"
                value={matchUrl}
                onChange={(e) => setMatchUrl(e.target.value)}
                placeholder="https://osu.ppy.sh/..."
              />
            </div>
          </div>

          <button 
            onClick={handleFetchData}
            disabled={loading}
            className="w-full bg-[#fdc15a] text-black font-black py-4 uppercase hover:bg-white transition-all disabled:opacity-50"
          >
            {loading ? 'ANALIZANDO...' : 'EXTRAER DATOS'}
          </button>
        </div>

        {/* El resto del código de previsualización se mantiene igual al anterior */}
        {previewData && (
          <div className="bg-[#1a1a1a] border border-white/10 p-6">
             <h3 className="text-[#fdc15a] font-bold mb-4 uppercase text-sm">Previsualización de datos</h3>
             {/* ... Mapeo de resultados ... */}
          </div>
        )}
      </div>
    </main>
  );
}