'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import PlayerCard from '../../components/PlayerCard';

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rank' | 'seed' | 'team'>('team'); // Default por equipo
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- FUNCIÓN MÁGICA DE ORDENAMIENTO POR EQUIPO ---
  const getTeamPriority = (seed: number) => {
    if (!seed) return 999;
    
    // Determinamos en qué bloque de 8 equipos está (1-8 o 9-16)
    const block = Math.floor((seed - 1) / 16); // 0 para seeds 1-16, 1 para 17-32
    const teamWithinBlock = ((seed - 1) % 8) + 1;
    
    const teamNumber = (block * 8) + teamWithinBlock;
    
    // El decimal (.1 o .2) sirve para que el Seed menor (capitán/top seed) 
    // quede siempre a la IZQUIERDA y el compañero a la DERECHA
    const isPartner = seed > (block * 16 + 8) ? 0.2 : 0.1;
    
    return teamNumber + isPartner;
  };

  const fetchJugadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select(`*, teams (name, logo_url)`);

    if (error) console.error('Error:', error);
    else setJugadores(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchJugadores(); }, []);

  // Lógica de cierre de dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- APLICAR ORDENAMIENTO ---
  const sortedJugadores = [...jugadores].sort((a, b) => {
    if (sortBy === 'rank') {
      return (a.country_rank || 999999) - (b.country_rank || 999999);
    }
    if (sortBy === 'seed') {
      return (a.seed || 999) - (b.seed || 999);
    }
    // Orden por Equipo (Pairing Logic)
    return getTeamPriority(a.seed) - getTeamPriority(b.seed);
  });

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-40">
      <div className="max-w-[1100px] mx-auto px-6"> 
        
        <div className="text-center mt-15 mb-8">
          <h1 className="font-['ITCMachine'] text-[80px] md:text-[120px] uppercase tracking-tighter leading-none">JUGADORES</h1>
        </div>

        {/* --- DROPDOWN DERECHA --- */}
        <div className="flex justify-end mb-16" ref={dropdownRef}>
          <div className="relative inline-block text-left">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-4 px-6 py-2.5 bg-[#1a1a1a] border-2 border-[#fdc15a] rounded-xl font-['ITCMachine'] text-lg text-[#fdc15a] hover:bg-[#fdc15a] hover:text-black transition-all shadow-[0_0_15px_rgba(253,193,90,0.1)]"
            >
              ORDENAR POR: {sortBy === 'seed' ? 'SEED INDIVIDUAL' : sortBy === 'rank' ? 'RANK 4K' : 'EQUIPOS'}
              <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border-2 border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={() => { setSortBy('team'); setIsDropdownOpen(false); }} className={`w-full px-6 py-4 text-left font-['ITCMachine'] text-base hover:bg-[#fdc15a] hover:text-black transition-colors ${sortBy === 'team' ? 'text-[#fdc15a]' : 'text-white/60'}`}>
                  POR EQUIPOS (PAREJAS)
                </button>
                <button onClick={() => { setSortBy('seed'); setIsDropdownOpen(false); }} className={`w-full px-6 py-4 text-left font-['ITCMachine'] text-base hover:bg-[#fdc15a] hover:text-black transition-colors ${sortBy === 'seed' ? 'text-[#fdc15a]' : 'text-white/60'}`}>
                  POR SEED INDIVIDUAL
                </button>
                <button onClick={() => { setSortBy('rank'); setIsDropdownOpen(false); }} className={`w-full px-6 py-4 text-left font-['ITCMachine'] text-base hover:bg-[#fdc15a] hover:text-black transition-colors ${sortBy === 'rank' ? 'text-[#fdc15a]' : 'text-white/60'}`}>
                  POR RANK NACIONAL 4K
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GRID: Gracias al lg:grid-cols-2, los compañeros quedarán pegados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {loading ? (
            <div className="col-span-full text-center text-[#fdc15a] animate-pulse">Cargando...</div>
          ) : (
            sortedJugadores.map((jugador, index) => (
              <PlayerCard
                key={jugador.id}
                nombre={jugador.nickname || `ID: ${jugador.osu_id}`} 
                osu_id={jugador.osu_id}
                rank={jugador.country_rank || 'TBD'} 
                seed={jugador.seed || '??'} 
                avatar={jugador.avatar_url}
                teamLogo={jugador.teams?.logo_url}
                teamName={jugador.teams?.name}
                estado={jugador.status}
                index={index}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}