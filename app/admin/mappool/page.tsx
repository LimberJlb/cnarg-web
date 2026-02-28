'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { fetchAndSaveBeatmap } from '../../../lib/mappoolService';

export default function AdminMappoolPage() {
  const [stages, setStages] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState('');
  const [bId, setBId] = useState('');
  const [pattern, setPattern] = useState<'RC' | 'LN' | 'HB' | 'SV' | 'TB'>('RC');
  const [slot, setSlot] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Estados para las opciones especiales de la CNARG
  const [isCustomMap, setIsCustomMap] = useState(false);
  const [isCustomSong, setIsCustomSong] = useState(false);
  const [artistPhoto, setArtistPhoto] = useState('');

  useEffect(() => {
    async function getStages() {
      const { data, error } = await supabase.from('stages').select('*');
      if (error) {
        console.error("Error cargando rondas:", error.message);
        return;
      }
      if (data) setStages(data);
    }
    getStages();
  }, []);

  const handleAdd = async () => {
    if (!selectedStage || !bId) return alert('Completá los campos');
    setLoading(true);
    
    try {
      // Enviamos los 7 argumentos requeridos por la nueva versión de la función
      await fetchAndSaveBeatmap(
        Number(bId), 
        selectedStage, 
        pattern, 
        slot, 
        isCustomMap, 
        isCustomSong, 
        artistPhoto
      );
      
      alert('¡Mapa añadido al pool de la CNARG!');
      
      // Limpiamos los campos técnicos para la siguiente carga
      setBId('');
      setIsCustomMap(false);
      setIsCustomSong(false);
      setArtistPhoto('');
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Ocurrió un error inesperado'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2e2e2e] p-10 text-white font-sans">
      <h1 className="font-['ITCMachine'] text-6xl text-[#fdc15a] mb-10">ADMIN PANEL: MAPPOOL</h1>
      
      <div className="bg-[#1a1a1a] p-8 rounded-sm border border-white/10 max-w-4xl shadow-2xl">
        {/* GRID PRINCIPAL (4 Campos base) */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Ronda / Stage</label>
            <select 
              className="bg-black border border-white/20 p-3 rounded text-white outline-none focus:border-[#fdc15a]"
              onChange={(e) => setSelectedStage(e.target.value)}
              value={selectedStage}
            >
              <option value="">Seleccionar Ronda...</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">osu! Beatmap ID</label>
            <input 
              value={bId} 
              onChange={(e) => setBId(e.target.value)}
              className="bg-black border border-white/20 p-3 rounded text-white outline-none focus:border-[#fdc15a]"
              placeholder="Ej: 123456"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Tipo de Patrón</label>
            <select 
              value={pattern} 
              onChange={(e) => setPattern(e.target.value as any)}
              className="bg-black border border-white/20 p-3 rounded text-white outline-none focus:border-[#fdc15a]"
            >
              <option value="RC">Rice (RC)</option>
              <option value="LN">Long Notes (LN)</option>
              <option value="HB">Hybrid (HB)</option>
              <option value="SV">Scroll Variation (SV)</option>
              <option value="TB">Tie Breaker (TB)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Slot Número</label>
            <input 
              type="number" 
              value={slot} 
              onChange={(e) => setSlot(Number(e.target.value))}
              className="bg-black border border-white/20 p-3 rounded text-white outline-none focus:border-[#fdc15a]"
            />
          </div>
        </div>

        {/* SECCIÓN DE OPCIONES ESPECIALES (Nuevos campos) */}
        <div className="border-t border-white/5 pt-6 mb-8">
          <h3 className="text-[#fdc15a] font-bold text-sm uppercase mb-4 tracking-widest">Opciones Especiales</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 justify-center">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isCustomMap} 
                  onChange={(e) => setIsCustomMap(e.target.checked)}
                  className="w-5 h-5 accent-[#fdc15a]"
                />
                <span className="text-xs font-bold uppercase text-gray-400 group-hover:text-white transition-colors">Custom Map</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isCustomSong} 
                  onChange={(e) => setIsCustomSong(e.target.checked)}
                  className="w-5 h-5 accent-[#fdc15a]"
                />
                <span className="text-xs font-bold uppercase text-gray-400 group-hover:text-white transition-colors">Custom Song (Original)</span>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase">URL Foto del Artista</label>
              <input 
                value={artistPhoto} 
                onChange={(e) => setArtistPhoto(e.target.value)}
                className="bg-black border border-white/20 p-3 rounded text-white outline-none focus:border-[#fdc15a] text-xs"
                placeholder="https://imgur.com/link-a-foto.jpg"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleAdd}
          disabled={loading}
          className="w-full bg-[#fdc15a] text-[#2e2e2e] font-['ITCMachine'] text-2xl py-4 hover:bg-[#e5ac4d] transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-[0.98]"
        >
          {loading ? 'PROCESANDO CON OSU!...' : 'VINCULAR MAPA AL POOL'}
        </button>
      </div>
    </div>
  );
}