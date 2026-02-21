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