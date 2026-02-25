// components/Admin/AddMapForm.tsx
import React, { useState } from 'react';
import { fetchAndSaveBeatmap } from '../../lib/mappoolService';

export default function AddMapForm({ stageId }: { stageId: string }) {
  const [bId, setBId] = useState('');
  const [pattern, setPattern] = useState<'RC' | 'LN' | 'HB' | 'SV' | 'TB'>('RC');
  const [slot, setSlot] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Nuevos estados para la personalización de la CNARG
  const [isCustomMap, setIsCustomMap] = useState(false);
  const [isCustomSong, setIsCustomSong] = useState(false);
  const [artistPhoto, setArtistPhoto] = useState('');

  const handleAdd = async () => {
    if (!stageId || !bId) return alert('Por favor, selecciona una ronda e ingresa un Beatmap ID');
    setLoading(true);
    
    try {
      // Enviamos todos los parámetros a la función del servicio
      await fetchAndSaveBeatmap(
        Number(bId), 
        stageId, 
        pattern, 
        slot, 
        isCustomMap, 
        isCustomSong, 
        artistPhoto
      );
      
      alert('¡Mapa añadido al pool de la CNARG con éxito!');
      
      // Limpiamos los campos para el siguiente mapa
      setBId('');
      setIsCustomMap(false);
      setIsCustomSong(false);
      setArtistPhoto('');
    } catch (err: any) {
      alert('Error: ' + err.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-lg border border-white/10 flex flex-col gap-6">
      {/* Primera Fila: Datos básicos */}
      <div className="flex gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-[#fdc15a]">Beatmap ID</label>
          <input 
            value={bId} onChange={(e) => setBId(e.target.value)}
            className="bg-black border border-white/20 p-2 rounded text-white w-32 outline-none focus:border-[#fdc15a] transition-colors"
            placeholder="Ej: 123456"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-[#fdc15a]">Patrón</label>
          <select 
            value={pattern} onChange={(e) => setPattern(e.target.value as any)}
            className="bg-black border border-white/20 p-2 rounded text-white outline-none focus:border-[#fdc15a] transition-colors"
          >
            <option value="RC">Rice (RC)</option>
            <option value="LN">Long Notes (LN)</option>
            <option value="HB">Hybrid (HB)</option>
            <option value="SV">Scroll Variation (SV)</option>
            <option value="TB">Tie Breaker (TB)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-[#fdc15a]">Slot</label>
          <input 
            type="number" value={slot} onChange={(e) => setSlot(Number(e.target.value))}
            className="bg-black border border-white/20 p-2 rounded text-white w-16 outline-none focus:border-[#fdc15a]"
          />
        </div>
      </div>

      {/* Segunda Fila: Opciones Custom y Foto del Artista */}
      <div className="flex gap-6 items-center border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            id="customMap"
            checked={isCustomMap} 
            onChange={(e) => setIsCustomMap(e.target.checked)}
            className="w-4 h-4 accent-[#fdc15a]"
          />
          <label htmlFor="customMap" className="text-[10px] uppercase font-bold text-gray-400 cursor-pointer hover:text-white transition-colors">
            Custom Map
          </label>
        </div>

        <div className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            id="customSong"
            checked={isCustomSong} 
            onChange={(e) => setIsCustomSong(e.target.checked)}
            className="w-4 h-4 accent-[#fdc15a]"
          />
          <label htmlFor="customSong" className="text-[10px] uppercase font-bold text-gray-400 cursor-pointer hover:text-white transition-colors">
            Custom Song (Original)
          </label>
        </div>

        <div className="flex flex-col gap-1 flex-grow">
          <label className="text-[10px] uppercase font-bold text-[#fdc15a]">URL Foto Artista (Opcional)</label>
          <input 
            value={artistPhoto} onChange={(e) => setArtistPhoto(e.target.value)}
            className="bg-black border border-white/20 p-2 rounded text-white text-xs outline-none focus:border-[#fdc15a]"
            placeholder="https://imgur.com/..."
          />
        </div>

        <button 
          onClick={handleAdd}
          disabled={loading}
          className="bg-[#fdc15a] text-black font-bold px-8 py-3 rounded hover:bg-[#e5ac4d] disabled:opacity-50 transition-all uppercase text-xs tracking-widest mt-4"
        >
          {loading ? 'Procesando...' : 'Añadir al Pool'}
        </button>
      </div>
    </div>
  );
}