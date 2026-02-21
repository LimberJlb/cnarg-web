'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthNav() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCustomSession = async () => {
      // 1. Buscamos la cookie manualmente
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('cna_auth_session='))
        ?.split('=')[1];

      if (cookieValue) {
        // 2. Si existe, buscamos ese osu_id en nuestra tabla 'users'
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('osu_id', cookieValue)
          .single();

        if (data && !error) {
          setUser(data);
        }
      }
      setLoading(false);
    };

    checkCustomSession();
  }, []);

  const handleLogout = () => {
    // Borramos la cookie y reseteamos el estado
    document.cookie = "cna_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    window.location.reload();
  };

  if (loading) return <div className="px-6 text-[#fdc15a] animate-pulse">...</div>;

  return (
    <div className="h-full">
      {user ? (
        <div className="flex items-center gap-4 px-6 h-full bg-[#1a1a1a]">
          <div className="text-right">
            <p className="text-[#fdc15a] font-['ITCMachine'] uppercase text-sm">{user.username}</p>
            <button onClick={handleLogout} className="text-xs text-white/50 hover:underline">SALIR</button>
          </div>
          <img src={user.avatar_url} className="w-10 h-10 rounded-full border border-[#fdc15a]" alt="" />
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
          className="bg-[#fdc15a] text-[#2e2e2e] font-['ITCMachine'] h-full px-12 text-[24px]"
        >
          INGRESAR
        </button>
      )}
    </div>
  );
}