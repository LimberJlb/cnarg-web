'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PlayerCard from '@/components/PlayerCard';

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJugadores() {
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('rank_nacional', { ascending: true });

      if (error) {
        console.error('Error:', error);
      } else {
        setJugadores(data || []);
      }
      setLoading(false);
    }
    fetchJugadores();
  }, []);

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-40">
      <nav className="flex justify-between items-center h-22 bg-[#2e2e2e] relative z-30 shadow-[0_9px_50px_rgba(0,0,0,0.5)]">
        <h1 className="text-[#fdc15a] font-['ITCMachine'] text-[60px] px-37">CNARG</h1>
        <div className="flex items-center h-full">
          <div className="flex space-x-9 text-sm font-['TrebuchetMS'] text-[#fdc15a] text-[20px] mr-15">
            <a href="/" className="cursor-pointer hover:text-white transition-colors">INICIO</a>
            <a href="/mappool" className="cursor-pointer hover:text-white transition-colors">MAPPOOL</a>
            <span className="cursor-pointer hover:text-white transition-colors">JUGADORES</span>
            <a href="/brackets" className="cursor-pointer hover:text-white transition-colors">BRACKETS</a>
            <a href="/staff" className="cursor-pointer hover:text-white transition-colors">STAFF</a>
            <a href="/estadisticas" className="cursor-pointer hover:text-white transition-colors">ESTADISTICAS</a>
          </div>
          <button className="cursor-pointer bg-[#fdc15a] hover:bg-[#d9953d] text-[#2e2e2e] font-['ITCMachine'] h-full px-13 transition-colors duration-200 text-[30px]">
            INGRESAR
          </button>
        </div>
      </nav>

      {/* --- AQUÍ COMIENZA EL CONTENEDOR DE CENTRADO --- */}
      <div className="max-w-[1100px] mx-auto px-6"> 
        
        {/* Título de la sección (Añádelo de nuevo si quieres que se vea) */}
        <div className="text-center mt-15 mb-12">
          <h1 className="font-['ITCMachine'] text-[120px] uppercase tracking-tighter leading-none">JUGADORES</h1>
        </div>

        {/* Grid para las tarjetas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {loading ? (
            <div className="col-span-full text-center text-[#fdc15a] font-['TrebuchetMS'] text-xl">
              Cargando participantes...
            </div>
          ) : (
            jugadores.map((jugador, index) => (
              <PlayerCard
                key={jugador.id || index}
                nombre={jugador.username}
                osu_id={jugador.osu_id}
                rank={jugador.rank_nacional} // Aquí asumo que este es el rank global o el número principal
                estado={jugador.status || 'participando , eliminado'} 
                index={index}
              />
            ))
          )}
        </div>
      </div>
      {/* --- AQUÍ TERMINA EL CONTENEDOR DE CENTRADO --- */}

    </main>
  );
}