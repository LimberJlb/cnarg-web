'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MatchCard from '../../components/MatchCard';
import MatchModal from '../../components/MatchModal';

export default function BracketsPage() {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [bracketView, setBracketView] = useState<'winners' | 'losers'>('winners');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartidos() {
      const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .order('match_order', { ascending: true });

      if (!error) setPartidos(data || []);
      setLoading(false);
    }
    fetchPartidos();
  }, []);

  const getMatchesByRound = (bracket: string, round: string) => {
    return partidos.filter(p => p.bracket_type === bracket && p.round_name === round);
  };

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden pb-40">
      <nav className="flex justify-between items-center h-22 bg-[#2e2e2e] relative z-30 shadow-[0_9px_50px_rgba(0,0,0,0.5)]">
        <h1 className="text-[#fdc15a] font-['ITCMachine'] text-[60px] px-37">CNARG</h1>
        <div className="flex items-center h-full">
          <div className="flex space-x-9 text-sm font-['TrebuchetMS'] text-[#fdc15a] text-[20px] mr-15">
            <a href="/" className="cursor-pointer hover:text-white transition-colors">INICIO</a>
            <a href="/mappool" className="cursor-pointer hover:text-white transition-colors">MAPPOOL</a>
            <a href="/jugadores" className="cursor-pointer hover:text-white transition-colors">JUGADORES</a>
            <span className="cursor-pointer hover:text-white transition-colors">BRACKETS</span>
            <a href="/staff" className="cursor-pointer hover:text-white transition-colors">STAFF</a>
            <a href="/estadisticas" className="cursor-pointer hover:text-white transition-colors">ESTADISTICAS</a>
          </div>
          <button className="cursor-pointer bg-[#fdc15a] hover:bg-[#d9953d] text-[#2e2e2e] font-['ITCMachine'] h-full px-13 transition-colors duration-200 text-[30px]">
            INGRESAR
          </button>
        </div>
      </nav>
      
      <div className="text-center mt-15 mb-12">
        <h1 className="font-['ITCMachine'] text-[120px] uppercase tracking-tighter leading-none">BRACKETS</h1>
      </div>

      {selectedMatch && (
        <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}

      {/* SELECTORES WINNERS/LOSERS */}
      <div className="flex justify-center gap-4 mb-20">
        <button 
          onClick={() => setBracketView('winners')}
          className={`px-10 py-3 font-['ITCMachine'] text-xl transition-all ${bracketView === 'winners' ? 'bg-[#fdc15a] text-[#2e2e2e]' : 'bg-black/40 text-[#fdc15a]'}`}
        >
          WINNERS
        </button>
        {/*<button 
          onClick={() => setBracketView('losers')}
          className={`px-10 py-3 font-['ITCMachine'] text-xl transition-all ${bracketView === 'losers' ? 'bg-[#fdc15a] text-[#2e2e2e]' : 'bg-black/40 text-[#fdc15a]'}`}
        >
          LOSERS
        </button>*/}
      </div>

      <div className="w-full overflow-x-auto px-10">
        <div className="min-w-[1600px] flex items-start gap-16 justify-center">
          
          {loading ? (
            <p className="text-[#fdc15a] font-['ITCMachine']">Cargando llaves...</p>
          ) : (
            <>
              {/* 1. ROUND OF 16 */}
              <div className="flex flex-col gap-8">
                <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 uppercase text-xs tracking-widest">Round of 16</h3>
                {getMatchesByRound(bracketView, 'Round of 16').map((match) => (
                  <MatchCard 
                    key={match.id}
                    p1={match.p1_name} p2={match.p2_name} 
                    s1={match.s1} s2={match.s2} 
                    estado={match.status} 
                    onClick={() => setSelectedMatch(match)}
                  />
                ))}
              </div>

              {/* 2. QUARTERFINALS - Aumentamos gap y bajamos la columna */}
              <div className="flex flex-col gap-40 pt-16">
                <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 uppercase text-xs tracking-widest">Quarterfinals</h3>
                {getMatchesByRound(bracketView, 'Quarterfinals').map((match) => (
                  <MatchCard 
                    key={match.id}
                    p1={match.p1_name} p2={match.p2_name} 
                    s1={match.s1} s2={match.s2} 
                    estado={match.status} 
                    onClick={() => setSelectedMatch(match)}
                  />
                ))}
              </div>

              {/* 3. SEMIFINALS - Gap mucho más grande para centrar */}
              <div className="flex flex-col gap-[400px] pt-48">
                <h3 className="text-center font-['ITCMachine'] text-[#fdc15a] bg-black/20 py-2 uppercase text-xs tracking-widest">Semifinals</h3>
                {getMatchesByRound(bracketView, 'Semifinals').map((match) => (
                  <MatchCard 
                    key={match.id}
                    p1={match.p1_name} p2={match.p2_name} 
                    s1={match.s1} s2={match.s2} 
                    estado={match.status} 
                    onClick={() => setSelectedMatch(match)}
                  />
                ))}
              </div>

              {/* 4. WINNERS FINAL - Posicionamiento final */}
              <div className="flex flex-col pt-[550px]">
                <h3 className="text-center font-['ITCMachine'] text-[#67a4da] bg-black/20 py-2 uppercase text-xs tracking-widest mb-4">Winners Final</h3>
                {getMatchesByRound(bracketView, 'Winners Final').map((match) => (
                  <MatchCard 
                    key={match.id}
                    p1={match.p1_name} p2={match.p2_name} 
                    s1={match.s1} s2={match.s2} 
                    estado={match.status} 
                    onClick={() => setSelectedMatch(match)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}