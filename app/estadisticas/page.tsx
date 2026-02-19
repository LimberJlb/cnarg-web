'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaff() {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('prioridad', { ascending: true });

      if (!error) setStaff(data || []);
      setLoading(false);
    }
    fetchStaff();
  }, []);

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden">
    <nav className="flex justify-between items-center h-22 bg-[#2e2e2e] relative z-30 shadow-[0_9px_50px_rgba(0,0,0,0.5)]">
  {/* Logo a la izquierda - Se mantiene con su padding */}
  <h1 className="text-[#fdc15a] font-['ITCMachine'] text-[60px] px-37">CNARG</h1>

  {/* Contenedor derecho: Agrupa links y botón */}
  <div className="flex items-center h-full">
    {/* Links de navegación - Eliminamos px lateral para que se peguen a la derecha */}
    <div className="flex space-x-9 text-sm font-['TrebuchetMS'] text-[#fdc15a] text-[20px] mr-15">
      <a href="/" className="cursor-pointer hover:text-white transition-colors">INICIO</a>
      <a href="/mappool" className="cursor-pointer hover:text-white transition-colors">MAPPOOL</a>
      <a href="/jugadores" className="cursor-pointer hover:text-white transition-colors">JUGADORES</a>
      <a href="/brackets" className="cursor-pointer hover:text-white transition-colors">BRACKETS</a>
      <a href="/staff" className="cursor-pointer hover:text-white transition-colors">STAFF</a>
      <span className="cursor-pointer hover:text-white transition-colors">ESTADISTICAS</span>
    </div>

    {/* Botón Ingresar */}
    <button className="cursor-pointer bg-[#fdc15a] hover:bg-[#d9953d] text-[#2e2e2e] font-['ITCMachine'] h-full px-13 transition-colors duration-200 text-[30px]">
      INGRESAR
    </button>
  </div>
</nav>

         <h1 className="font-['ITCMachine'] text-[80px] uppercase mb-12 text-center">WIP</h1>

      {/* {loading ? (
        <p className="text-center font-['TrebuchetMS'] text-[#fdc15a]">CARGANDO EQUIPO...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {staff.map((member, index) => (
            <div key={member.id || index} className="bg-[#1a1a1a] rounded-3xl p-8 border border-white/5 flex flex-col items-center text-center hover:border-[#fdc15a]/50 transition-colors">
              <img 
                src={`https://a.ppy.sh/${member.osu_id}`} 
                alt={member.name}
                className="w-32 h-32 rounded-full border-4 border-[#fdc15a] mb-6 object-cover shadow-lg"
              />
              <h2 className="font-['ITCMachine'] text-3xl uppercase tracking-tighter">{member.name}</h2>
              <p className="font-['TrebuchetMS'] text-[#fdc15a] font-bold text-sm tracking-widest mt-2 uppercase">
                {member.role}
              </p>
            </div>
          ))}
        </div> */}
    
    </main>
  );
}