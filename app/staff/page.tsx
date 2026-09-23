'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import StaffCard from '../../components/StaffCard';
import LoadingScreen from '../../components/LoadingScreen';

interface CustomLink {
  label: string;
  url: string;
}

interface StaffMember {
  id: string;
  nickname: string;
  osu_id: string;
  roles: string[];
  custom_links?: CustomLink[] | null;
  created_at?: string;
}

interface SectionConfig {
  id: string;
  title: string;
  roles: string[];
  isSmall?: boolean;
  isHost?: boolean;
  categoryTab: string;
}

interface AgradecimientoItem {
  id: string;
  name: string;
  iconType: 'crown' | 'mct' | 'pmc' | 'star' | 'lightning' | 'shield';
}

const AGRADECIMIENTOS_LIST: AgradecimientoItem[] = [
  {
    id: 'agr-los-reales',
    name: 'Los Reales',
    iconType: 'crown',
  },
  {
    id: 'agr-mct',
    name: 'Mania Chilean Tournament Team',
    iconType: 'mct',
  },
  {
    id: 'agr-pmc',
    name: 'Peru Mania Cup Team',
    iconType: 'pmc',
  },
  {
    id: 'agr-thiago',
    name: 'Thiago',
    iconType: 'star',
  },
  {
    id: 'agr-saragi',
    name: 'Saragi',
    iconType: 'lightning',
  },
  {
    id: 'agr-fumo-clan',
    name: 'Fumo Clan',
    iconType: 'shield',
  },
];

function renderAgradecimientoIcon(type: AgradecimientoItem['iconType']) {
  switch (type) {
    case 'crown':
      return (
        <svg className="w-6 h-6 text-[#fdc15a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
          <path d="M5 19h14" />
        </svg>
      );
    case 'mct':
      return (
        <svg className="w-6 h-6 text-[#fdc15a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
        </svg>
      );
    case 'pmc':
      return (
        <svg className="w-6 h-6 text-[#fdc15a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
          <path d="M7 6H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
          <path d="M17 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
        </svg>
      );
    case 'star':
      return (
        <svg className="w-6 h-6 text-[#fdc15a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'lightning':
      return (
        <svg className="w-6 h-6 text-[#fdc15a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'shield':
      return (
        <svg className="w-6 h-6 text-[#fdc15a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}

const SECTIONS: SectionConfig[] = [
  { id: 'admin', title: 'Hosts', roles: ['Host'], isHost: true, categoryTab: 'HOSTS' },
  { id: 'map-leading', title: 'Map Leading', roles: ['Map-Leading'], categoryTab: 'MAPPING' },
  { id: 'map-creators', title: 'Map Creators', roles: ['Map-Creator', 'Map-Suggestor'], categoryTab: 'MAPPING' },
  { id: 'map-helping', title: 'Map Helping', roles: ['Map-Helper'], categoryTab: 'MAPPING' },
  { id: 'musica', title: 'Música', roles: ['Music Artist'], categoryTab: 'ARTE & MÚSICA' },
  { id: 'arte', title: 'Arte', roles: ['GFX'], categoryTab: 'ARTE & MÚSICA' },
  { id: 'testers', title: 'Testers', roles: ['Playtester', 'Replayer'], categoryTab: 'TESTERS' },
  { id: 'referees', title: 'Referees', roles: ['Referee'], categoryTab: 'REFEREES' },
  { id: 'streams', title: 'Streams & Casters', roles: ['Streamer', 'Caster'], categoryTab: 'STREAMS' },
  { id: 'desarrollo', title: 'Desarrollo', roles: ['Developer', 'Sheeter'], categoryTab: 'DESARROLLO' },
  { id: 'agradecimientos', title: 'Agradecimientos', roles: ['Agradecimientos'], isSmall: true, categoryTab: 'AGRADECIMIENTOS' },
];

const CATEGORY_TABS = [
  { id: 'ALL', label: 'TODOS' },
  { id: 'HOSTS', label: 'HOSTS' },
  { id: 'MAPPING', label: 'MAPPING' },
  { id: 'REFEREES', label: 'REFEREES' },
  { id: 'STREAMS', label: 'STREAMS' },
  { id: 'ARTE & MÚSICA', label: 'ARTE & MÚSICA' },
  { id: 'TESTERS', label: 'TESTERS' },
  { id: 'DESARROLLO', label: 'DESARROLLO' },
  { id: 'AGRADECIMIENTOS', label: 'AGRADECIMIENTOS' },
];

let staffCache: StaffMember[] | null = null;

async function fetchWithRetry<T = any>(
  fn: () => PromiseLike<{ data: T | null; error: any }> | Promise<{ data: T | null; error: any }>,
  retries = 2,
  delayMs = 1200
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fn();
      if (!res.error && res.data) return res;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return res;
      }
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        return { data: null, error: err };
      }
    }
  }
  return { data: null, error: new Error('Exceeded retries') };
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchStaff = async () => {
    if (staffCache) {
      setStaff(staffCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await fetchWithRetry(() => supabase.from('staff').select('*'));
      if (!error && data) {
        // Excluir gags de brackets que no son personas reales (ej. Todos, El Chat)
        const validStaff = (data as StaffMember[]).filter(
          (m) =>
            m.roles &&
            m.roles.length > 0 &&
            !['todos', 'el chat'].includes(m.nickname.trim().toLowerCase())
        );
        staffCache = validStaff;
        setStaff(validStaff);
      }
    } catch (err) {
      console.error('Error cargando staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Staff | CNARG 4K 2026';
    fetchStaff();
  }, []);

  // Miembros filtrados por búsqueda
  const searchedStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const q = searchQuery.toLowerCase().trim();
    return staff.filter(
      (m) =>
        m.nickname.toLowerCase().includes(q) ||
        m.roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [staff, searchQuery]);

  // Miembros por categoría
  const getStaffForSection = (rolesToSearch: string[]) => {
    return searchedStaff.filter((member) =>
      member.roles.some((role: string) => rolesToSearch.includes(role))
    );
  };

  // Agradecimientos filtrados por búsqueda
  const filteredAgradecimientos = useMemo(() => {
    if (!searchQuery.trim()) return AGRADECIMIENTOS_LIST;
    const q = searchQuery.toLowerCase().trim();
    return AGRADECIMIENTOS_LIST.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (loading) {
    return <LoadingScreen message="CARGANDO STAFF..." />;
  }

  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans pb-32 select-none animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* TÍTULO PRINCIPAL */}
        <div className="text-center pt-8 sm:pt-14 mb-6 sm:mb-8">
          <h1 className="font-['ITCMachine'] text-4xl sm:text-6xl md:text-[90px] uppercase tracking-tighter leading-none drop-shadow-lg">
            STAFF
          </h1>
          <p className="text-zinc-400 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">
            Equipo organizador, creadores de contenido, árbitros y colaboradores
          </p>
        </div>

        {/* BARRA DE HERRAMIENTAS: CONTADORES */}
        <div className="bg-[#1a1a1a] p-3 sm:p-4 rounded-xl border border-white/5 shadow-xl mb-6 sm:mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block font-sans">
                TOTAL DE MIEMBROS
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-['ITCMachine'] text-2xl sm:text-3xl text-white">{staff.length}</span>
                <span className="text-xs text-zinc-400">colaboradores</span>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>

            <div className="block">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block font-sans">
                ROLES TOTALES
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-['ITCMachine'] text-2xl sm:text-3xl text-[#fdc15a]">
                  {staff.reduce((acc, m) => acc + (m.roles?.length || 0), 0)}
                </span>
                <span className="text-xs text-zinc-400">asignaciones</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS DE CATEGORÍA Y BUSCADOR */}
        <div className="bg-[#1a1a1a] p-3 sm:p-4 rounded-xl border border-white/5 shadow-xl mb-8 sm:mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs por categoría (Sin emojis) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-[11px] font-black uppercase tracking-widest px-3 sm:px-3.5 py-1.5 rounded transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#fdc15a] text-black shadow-[0_0_10px_#fdc15a]'
                    : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="w-full lg:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nickname o rol..."
              className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#fdc15a] transition-colors"
            />
          </div>
        </div>

        {/* LISTADO DE SECCIONES */}
        <div className="space-y-12 sm:space-y-16">
          {SECTIONS.filter(
            (sec) => activeTab === 'ALL' || sec.categoryTab === activeTab
          ).map((sec) => {
            if (sec.id === 'agradecimientos') {
              if (filteredAgradecimientos.length === 0) return null;

              return (
                <div key={sec.id} className="relative">
                  {/* Encabezado de la categoría (Sin emojis) */}
                  <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-2 border-b border-white/5">
                    <div className="h-5 sm:h-6 w-1.5 bg-[#fdc15a] rounded-full"></div>
                    <h2 className="font-['ITCMachine'] text-2xl sm:text-4xl text-white tracking-wide uppercase">
                      {sec.title}
                    </h2>
                    <span className="text-xs font-sans text-zinc-500 font-bold ml-2">
                      ({filteredAgradecimientos.length})
                    </span>
                  </div>

                  {/* Grilla de Agradecimientos (Solo nombre y logo SVG) */}
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAgradecimientos.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-4 bg-[#1a1a1a] border border-white/10 hover:border-[#fdc15a]/80 rounded-xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(253,193,90,0.2)] overflow-hidden"
                      >
                        {/* Logo SVG */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-black/40 border border-white/5 group-hover:border-[#fdc15a]/40 group-hover:bg-[#fdc15a]/10 flex items-center justify-center transition-colors">
                          {renderAgradecimientoIcon(item.iconType)}
                        </div>

                        {/* Nombre */}
                        <div
                          className="font-['ITCMachine'] text-base sm:text-lg text-white group-hover:text-[#fdc15a] transition-colors uppercase tracking-wide leading-snug"
                          title={item.name}
                        >
                          {item.name}
                        </div>

                        {/* Barrita inferior animada */}
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#fdc15a] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-xl"></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const members = getStaffForSection(sec.roles);
            if (members.length === 0) return null;

            return (
              <div key={sec.id} className="relative">
                {/* Encabezado de la categoría (Sin emojis) */}
                <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-2 border-b border-white/5">
                  <div className="h-5 sm:h-6 w-1.5 bg-[#fdc15a] rounded-full"></div>
                  <h2 className="font-['ITCMachine'] text-2xl sm:text-4xl text-white tracking-wide uppercase">
                    {sec.title}
                  </h2>
                  <span className="text-xs font-sans text-zinc-500 font-bold ml-2">
                    ({members.length})
                  </span>
                </div>

                {/* Grilla de tarjetas */}
                <div
                  className={`grid gap-3 sm:gap-5 ${
                    sec.isSmall
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                  }`}
                >
                  {members.map((m) => (
                    <StaffCard
                      key={m.id}
                      id={m.id}
                      name={m.nickname}
                      osuId={m.osu_id}
                      roles={m.roles}
                      customLinks={m.custom_links}
                      isSmall={sec.isSmall}
                      isHost={sec.isHost}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Mensaje de no resultados */}
          {((activeTab === 'AGRADECIMIENTOS' && filteredAgradecimientos.length === 0) ||
            (activeTab !== 'AGRADECIMIENTOS' &&
              searchedStaff.length === 0 &&
              filteredAgradecimientos.length === 0)) && (
            <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-dashed border-white/5">
              <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest font-sans">
                No se encontraron miembros de staff para "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}