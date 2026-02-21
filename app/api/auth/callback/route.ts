import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Si no pusiste bien las variables 
    if (error || !code) {
        // dsakljdasljk, algo falló antes de tiempo
        return NextResponse.redirect(new URL('/?error=OAuthFailedOrCanceled', request.url));
    }

    try {
        // Por favor que este todo
        const clientId = process.env.NEXT_PUBLIC_OSU_CLIENT_ID;
        const clientSecret = process.env.OSU_CLIENT_SECRET;
        const redirectUri = process.env.NEXT_PUBLIC_OSU_REDIRECT_URI;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !supabaseServiceKey) {
            throw new Error('Faltan variables de entorno esenciales. dsakljdasljk, revisa tu .env');
        }

        // Intercambiar el code por token
        const tokenResponse = await fetch('https://osu.ppy.sh/oauth/token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Falló el fetch del token:', errorText, 'dsakljdasljk');
            throw new Error('No se pudo sacar el token de osu!. dsakljdasljk');
        }

        const tokenData = await tokenResponse.json();

        // Traer info del usuario
        const userResponse = await fetch('https://osu.ppy.sh/api/v2/me', {
            headers: { Authorization: `Bearer ${tokenData?.access_token}`, 'Accept': 'application/json' },
        });

        if (!userResponse.ok) {
            throw new Error('No pude sacar el perfil del usuario. dsakljdasljk');
        }

        const osuUser = await userResponse.json();

        // Guardar en Supabase (SERVICE_ROLE_KEY porque tenemos permiso total)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { data: dbUser, error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert({
                osu_id: osuUser?.id,
                username: osuUser?.username,
                avatar_url: osuUser?.avatar_url,
                access_token: tokenData?.access_token,
                refresh_token: tokenData?.refresh_token,
            }, { onConflict: 'osu_id' })
            .select()
            .single();

        if (upsertError) {
            console.error('Supabase Upsert Error:', upsertError, 'dsakljdasljk');
            throw new Error('Error guardando al usuario. dsakljdasljk');
        }

        // Poner cookie de sesión y redirigir al dashboard
        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        response.cookies.set('cna_auth_session', dbUser?.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 semana
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('OAuth Callback Controller Error:', error, 'dsakljdasljk');
        // Siempre redirigir a inicio para mostrar el error
        return NextResponse.redirect(new URL(`/?error=AuthenticationFailed`, request.url));
    }
}