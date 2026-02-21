'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import StaffCard from '../../components/StaffCard';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStaff() {
      const { data } = await supabase.from('staff').select('*');
      setStaff(data || []);
    }
    fetchStaff();
  }, []);

  // Función para filtrar staff por categoría basándose en sus roles
  const getStaffByCategory = (rolesToSearch: string[]) => {
    return staff.filter(member => 
      member.roles.some((role: string) => rolesToSearch.includes(role))
    );
  };

  // Renderizador de secciones
  const renderSection = (title: string, roles: string[], isSmall: boolean = false) => {
    const members = getStaffByCategory(roles);
    if (members.length === 0) return null;

    return (
      <div className="mb-20">
        <h2 className="font-['ITCMachine'] text-4xl text-[#fdc15a] mb-8 border-l-4 border-[#fdc15a] pl-4 uppercase">
          {title}
        </h2>
        <div className="flex flex-wrap gap-8 justify-start">
          {members.map(m => (
            <StaffCard 
              key={m.id} 
              name={m.nickname} 
              osuId={m.osu_id} 
              roles={m.roles} 
              customLinks={m.custom_links}
              isSmall={isSmall}
            />
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#2e2e2e] p-12 overflow-y-auto custom-scrollbar">
      <h1 className="font-['ITCMachine'] text-[100px] text-white uppercase mb-16 text-center">STAFF</h1>
      
      <div className="max-w-7xl mx-auto">
        {renderSection("Administración", ["Host"])}
        {renderSection("Map Leading", ["Map-Leading"])}
        {renderSection("Map Creators", ["Map-Creator", "Map-Suggestor"])}
        {renderSection("Map-Helping", ["Map-Helper"])}
        {renderSection("Música", ["Music Artist"])}
        {renderSection("Arte", ["GFX"])}
        {renderSection("Testers", ["Playtester", "Replayer"])}
        {renderSection("Referee", ["Referee"])}
        {renderSection("Streams", ["Streamer", "Caster"])}
        {renderSection("Desarrollo", ["Developer", "Sheeter"])}

        {/* Sección de Agradecimientos con tamaño reducido */}
        {renderSection("Agradecimientos", ["Agradecimientos"], true)}
  
      </div>
      </div>
    
  );
}