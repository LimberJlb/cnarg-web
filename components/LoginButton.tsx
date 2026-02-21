'use client';

import { useState } from 'react';

export default function LoginButton() {
    const [loading, setLoading] = useState(false);

    const startLogin = () => {
        try {
            setLoading(true);

            const clientId = process.env.NEXT_PUBLIC_OSU_CLIENT_ID;
            const redirectUri = process.env.NEXT_PUBLIC_OSU_REDIRECT_URI;

            if (!clientId || !redirectUri) {
                throw new Error(
                    'Oops, parece que las variables de entorno de osu! no están listas. Limber por favor pone bien aca lkjdaslkajd'
                );
            }

            // Pedimos solo lo mínimo: identificar al usuario
            const scope = 'identify';
            const encodedRedirectUri = encodeURIComponent(redirectUri);

            const authUrl = `https://osu.ppy.sh/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}`;

            // Vamos a la página de autorización de osu!
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error iniciando sesión:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : '¡Ups! Algo salió mal al intentar iniciar sesión'
            );
            setLoading(false);
        }
    };

    return (
        <button
            onClick={startLogin}
            disabled={loading}
            className={`cursor-pointer bg-[#fdc15a] hover:bg-[#d9953d] text-[#2e2e2e] font-['ITCMachine'] h-full px-13 transition-colors duration-200 text-[30px] ${loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
        >
            {loading ? 'CONECTANDO...' : 'INGRESAR'}
        </button>
    );
}