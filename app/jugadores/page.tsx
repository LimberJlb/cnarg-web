'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import PlayerCard from '../../components/PlayerCard';

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // 1. Cargar jugadores de la tabla 'players'
  const fetchJugadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players') // Nombre correcto de la tabla
      .select(`
      *,
      teams (
        name,
        logo_url
      )
    `)
      .order('country_rank', { ascending: true }); // Columna correcta

    if (error) {
      console.error('Error:', error);
    } else {
      setJugadores(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJugadores();
  }, []);

  // 2. Función para disparar la sincronización de un jugador
  const handleSync = async (osuId: number) => {
    setSyncingId(osuId);
    try {
      const res = await fetch('/api/players/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osuId }),
      });
      const data = await res.json();
      
      if (data.success) {
        // Recargamos los datos localmente para ver los cambios
        await fetchJugadores();
      } else {
        alert("Error al sincronizar: " + data.error);
      }
    } catch (err) {
      console.error("Error en la petición:", err);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-40">
      <div className="max-w-[1100px] mx-auto px-6"> 
        
        <div className="text-center mt-15 mb-12">
          <h1 className="font-['ITCMachine'] text-[120px] uppercase tracking-tighter leading-none">JUGADORES</h1>
          <p className="text-[#fdc15a] font-bold tracking-[0.2em] mt-2">CNARG 2026</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {loading ? (
            <div className="col-span-full text-center text-[#fdc15a] font-['TrebuchetMS'] text-xl animate-pulse">
              Cargando participantes...
            </div>
          ) : (
            jugadores.map((jugador, index) => (
              <div key={jugador.id || index} className="flex flex-col gap-2">
                {/* Botón de Sincronización flotante para pruebas */}
                {!jugador.nickname && (
                  <button 
                    onClick={() => handleSync(jugador.osu_id)}
    disabled={syncingId === jugador.osu_id}
    className="w-fit self-end bg-[#fdc15a] text-black text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 z-30"
  >
                    {syncingId === jugador.osu_id ? '🔄' : '✨ COMPLETAR DATOS'}
                  </button>
                )}

                <PlayerCard
                  nombre={jugador.nickname || `ID: ${jugador.osu_id}`} // Usa nickname
                  osu_id={jugador.osu_id}
                  rank={jugador.country_rank || 'TBD'} // Usa country_rank
                  avatar={jugador.avatar_url}
                  teamLogo={jugador.teams?.logo_url} // Pasamos el logo del equipo
                  teamName={jugador.teams?.name} // <-- Nueva prop
                  index={index}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}