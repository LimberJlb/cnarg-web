'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthNav() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    checkCustomSession();
  }, []);

  const handleLogout = () => {
    document.cookie = "cna_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    window.location.reload();
  };

  const containerStyles = "h-full flex items-center bg-[#fdc15a] px-4 lg:px-6 transition-all duration-300 hover:bg-[#e0a94a] cursor-pointer min-w-[140px] lg:min-w-[180px] justify-center text-black relative border-none";

  if (loading) return (
    <div className={containerStyles}>
      <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin"></div>
    </div>
  );

  return (
    <div className="h-full">
      {user ? (
        <div className={containerStyles}>
          <div className="flex items-center gap-4 h-full">
            
            <div className="relative flex items-center h-full">
              <p className="font-['ITCMachine'] uppercase text-xl lg:text-2xl leading-none">
                {user.username}
              </p>
              
              <button 
                onClick={handleLogout} 
                className="absolute top-[calc(50%+14px)] right-0 text-[10px] font-black text-black/50 hover:text-black uppercase tracking-widest transition-colors whitespace-nowrap"
              >
                SALIR
              </button>
            </div>

            {/* AVATAR CUADRADO: Sin redondeos para evitar el conflicto de CSS */}
            <div className="w-10 h-10 lg:w-12 lg:h-12 border-2 border-black bg-black/20 flex-shrink-0 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              <img 
                src={user.avatar_url} 
                className="w-full h-full object-cover block" 
                alt={user.username} 
              />
            </div>
          </div>
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