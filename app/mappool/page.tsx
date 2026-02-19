'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MappoolPage() {
  const [rondaActual, setRondaActual] = useState('ROUND OF 16');
  const [todosLosMapas, setTodosLosMapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Traer los datos de Supabase
  useEffect(() => {
    async function fetchMappool() {
      const { data, error } = await supabase
        .from('mappool')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) console.error('Error:', error);
      else setTodosLosMapas(data || []);
      setLoading(false);
    }
    fetchMappool();
  }, []);

  // Filtrar mapas localmente según el botón presionado
  const mapasFiltrados = todosLosMapas.filter(m => m.ronda === rondaActual);

  const rondas = ['QUALIFIERS', 'ROUND OF 16'];

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-14">
    <nav className="flex justify-between items-center h-22 bg-[#2e2e2e] relative z-30 shadow-[0_9px_50px_rgba(0,0,0,0.5)]">
  {/* Logo a la izquierda - Se mantiene con su padding */}
  <h1 className="text-[#fdc15a] font-['ITCMachine'] text-[60px] px-37">CNARG</h1>

  {/* Contenedor derecho: Agrupa links y botón */}
  <div className="flex items-center h-full">
    {/* Links de navegación - Eliminamos px lateral para que se peguen a la derecha */}
    <div className="flex space-x-9 text-sm font-['TrebuchetMS'] text-[#fdc15a] text-[20px] mr-15">
      <a href="/" className="cursor-pointer hover:text-white transition-colors">INICIO</a>
      <span className="cursor-pointer hover:text-white transition-colors">MAPPOOL</span>
      <a href="/jugadores" className="cursor-pointer hover:text-white transition-colors">JUGADORES</a>
      <a href="/brackets" className="cursor-pointer hover:text-white transition-colors">BRACKETS</a>
      <a href="/staff" className="cursor-pointer hover:text-white transition-colors">STAFF</a>
      <a href="/estadisticas" className="cursor-pointer hover:text-white transition-colors">ESTADISTICAS</a>
    </div>

    {/* Botón Ingresar */}
    <button className="cursor-pointer bg-[#fdc15a] hover:bg-[#d9953d] text-[#2e2e2e] font-['ITCMachine'] h-full px-13 transition-colors duration-200 text-[30px]">
      INGRESAR
    </button>
  </div>
  </nav>

      <div className="text-center mb-12 mt-15">
        <h1 className="font-['ITCMachine'] text-[120px] uppercase tracking-tighter leading-none">MAPPOOL</h1>
      </div>

      {/* Botones de Rondas */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {rondas.map((ronda) => (
          <button
            key={ronda}
            onClick={() => setRondaActual(ronda)}
            className={`font-['ITCMachine'] text-2xl px-10 py-3 rounded-xl transition-all transform hover:scale-105 ${
              rondaActual === ronda 
                ? 'bg-[#fdc15a] text-[#2e2e2e] shadow-lg' 
                : 'bg-white text-[#2e2e2e] opacity-80 hover:opacity-100'
            }`}
          >
            {ronda}
          </button>
        ))}
      </div>


        {/* Mappool bars */}
      <div className="flex flex-col gap-[2px] w-full max-w-[1200px] mx-auto font-sans shadow-2xl">
        {/* CABECERA DE LA TABLA - IDENTIFICADORES */}
        <div className="flex h-[35px] w-full items-stretch overflow-hidden mb-1 px-0 opacity-90">
          {/* Espacio para SLOT y BARRA (Vacíos o con texto "STAGE") */}
          <div className="w-[90px] bg-[#fdc15a] flex items-center justify-center text-[#2e2e2e] font-black text-[14px] uppercase tracking-tighter flex-shrink-0">
            STAGE
            </div>
            <div className="w-[15px] bg-[#fdc15a] flex-shrink-0"></div>
            {/* Espacio para TITULO */}
            <div className="flex-grow bg-[#fdc15a] flex items-center px-10 min-w-0 border-l border-black/10">
            <span className="font-black text-[14px] uppercase text-[#2e2e2e] tracking-widest">NOMBRE DEL MAPA</span>
              </div>
              
              {/* BLOQUES TÉCNICOS - Nombres de columnas */}
              <div className="flex flex-shrink-0 text-[#2e2e2e] font-black text-[14px] tracking-tighter">
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">BPM</div>
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">SR</div>
                <div className="w-[70px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">LENGTH</div>
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">HP</div>
                <div className="w-[60px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">OD</div>
                <div className="w-[120px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10">MAPPER</div>
                <div className="w-[90px] bg-[#fdc15a] flex items-center justify-center border-l border-black/10 rounded-tr-sm">MAP ID</div>
              </div>
          </div>

  {loading ? (
    <div className="p-10 text-center text-[#fdc15a] bg-[#1a1a1a]">Cargando mappool...</div>
  ) : (
    mapasFiltrados.map((mapa, index) => (
      <div key={mapa.id || index} className="flex h-[70px] w-full items-stretch overflow-hidden">
        
        {/* 1. SLOT - Bloque Blanco Izquierda */}
        <div className="w-[80px] bg-white flex items-center justify-center text-[#2e2e2e] font-bold text-[16px] flex-shrink-0">
          {mapa.slot}
        </div>

        {/* 2. BARRA Y BANNER - Bloque Blanco con Color */}
        <div className="w-[25px] bg-white flex items-center justify-center flex-shrink-0 relative border-l border-black/5">
          {/* La barrita de color vertical */}
          <div className="w-[10px] h-[40px] bg-[#6b58ce] rounded-sm mr-2"></div>
          
        </div>

        {/* 3. TÍTULO - Bloque Negro con Imagen de Fondo */}
        <div className="flex-grow relative bg-[#1a1a1a] flex items-center px-8 min-w-0 border-l border-white/5">
    {/* Imagen con mayor opacidad para que se vea el arte */}
    <img 
      src={`https://assets.ppy.sh/beatmaps/${mapa["MAP SET ID"] || ''}/covers/cover.jpg`}
      className="absolute inset-0 w-full h-full object-cover opacity-50 hover:opacity-70 transition-opacity duration-300"
      onError={(e) => { e.currentTarget.src = `https://assets.ppy.sh/beatmaps/${mapa.banner_id}/covers/card.jpg` }}
    />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
          <div className="relative z-10 font-bold text-[15px] flex-grow text-white tracking-normal drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
          <a 
              href={`https://osu.ppy.sh/b/${mapa.beatmap_id}`} 
              target="_blank" 
              className="hover:underline"
            >
              {mapa.nombre}
            </a>
            </div>
          </div>

        {/* 4. BLOQUES TÉCNICOS - Grises Intercalados */}
        <div className="flex flex-shrink-0 text-white font-bold text-[13px]">
          {/* BPM */}
          <div className="w-[60px] bg-[#3a3a3a] flex items-center justify-center border-r border-white/5">
            {mapa.bpm}
          </div>
          {/* SR */}
          <div className="w-[60px] bg-[#444444] flex items-center justify-center border-r border-white/5">
            {mapa.sr}
          </div>
          {/* LENGTH */}
          <div className="w-[70px] bg-[#3a3a3a] flex items-center justify-center border-r border-white/5">
            {mapa.length}
          </div>
          {/* HP */}
          <div className="w-[60px] bg-[#444444] flex items-center justify-center border-r border-white/5">
            {mapa.combo}
          </div>
          {/* OD */}
          <div className="w-[60px] bg-[#3a3a3a] flex items-center justify-center border-r border-white/5">
            {mapa.od}
          </div>
          {/* MAPPER */}
          <div className="w-[120px] bg-[#444444] flex items-center justify-center px-2 truncate text-[14px]">
            {mapa.mapper}
          </div>
          {/* MAP ID - Naranja CNARG */}
          <div className="w-[90px] bg-[#3a3a3a] flex items-center justify-center text-[#fdc15a] hover:bg-[#2e2e2e] transition-colors">
            <a 
              href={`https://osu.ppy.sh/b/${mapa.beatmap_id}`} 
              target="_blank" 
              className="hover:underline"
            >
              {mapa.beatmap_id}
            </a>
          </div>
        </div>
      </div>
      
    ))
  )}
</div>
    </main>
  );
}