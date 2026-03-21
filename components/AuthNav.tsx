'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function AuthNav() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkCustomSession = async () => {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('cna_auth_session='))
        ?.split('=')[1];

      if (cookieValue) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('osu_id', cookieValue)
          .single();

        if (data && !error) setUser(data);
      }
      setLoading(false);
    };

    // Cerrar menú al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    checkCustomSession();
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    document.cookie = "cna_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    window.location.reload();
  };

  const containerStyles = "h-full flex items-center bg-[#fdc15a] px-4 lg:px-6 transition-all duration-300 hover:bg-[#e0a94a] cursor-pointer min-w-[140px] lg:min-w-[180px] justify-center text-black relative border-none select-none";

  if (loading) return (
    <div className={containerStyles}>
      <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin"></div>
    </div>
  );

  return (
    <div className="h-full" ref={menuRef}>
      {user ? (
        <div className="h-full relative">
          {/* TRIGGER DEL MENÚ */}
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`${containerStyles} ${isMenuOpen ? 'bg-[#e0a94a]' : ''}`}
          >
            <div className="flex items-center gap-4 h-full">
              <div className="flex flex-col items-end">
                <p className="font-['ITCMachine'] uppercase text-xl lg:text-2xl leading-none">
                  {user.username}
                </p>
                <span className="text-[9px] font-black text-black/40 tracking-[0.2em] mt-1">
                  {isMenuOpen ? 'CERRAR ▲' : 'MENÚ ▼'}
                </span>
              </div>

              <div className="w-10 h-10 lg:w-12 lg:h-12 border-2 border-black bg-black/20 flex-shrink-0 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                <img 
                  src={user.avatar_url} 
                  className="w-full h-full object-cover block" 
                  alt={user.username} 
                />
              </div>
            </div>
          </div>

          {/* MENÚ DESPLEGABLE */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 w-full min-w-[200px] bg-[#1a1a1a] border-x-2 border-b-2 border-[#fdc15a] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-2 duration-200 z-[100]">
              

              <div className="h-[1px] bg-white/5 mx-4" />

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 hover:bg-red-600 group transition-colors text-left"
              >
                <span className="text-red-500 group-hover:text-white font-['ITCMachine'] text-lg tracking-widest uppercase">
                  Cerrar Sesión
                </span>
                <span className="text-red-500 group-hover:text-white text-xl">➔</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={() => {
            const root = 'https://osu.ppy.sh/oauth/authorize';
            const params = new URLSearchParams({
              client_id: process.env.NEXT_PUBLIC_OSU_CLIENT_ID!,
              redirect_uri: process.env.NEXT_PUBLIC_OSU_REDIRECT_URI!,
              response_type: 'code',
              scope: 'identify',
            });
            window.location.href = `${root}?${params}`;
          }}
          className={`${containerStyles} group`}
        >
          <span className="font-['ITCMachine'] text-2xl lg:text-3xl tracking-widest group-hover:scale-105 transition-transform">
            INGRESAR
          </span>
        </button>
      )}
    </div>
  );
}