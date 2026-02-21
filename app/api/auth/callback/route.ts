import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.redirect(new URL('/?error=no_code', request.url));

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Intercambio de tokens (osu!)
        const tokenResponse = await fetch('https://osu.ppy.sh/oauth/token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.NEXT_PUBLIC_OSU_CLIENT_ID,
                client_secret: process.env.OSU_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.NEXT_PUBLIC_OSU_REDIRECT_URI,
            }),
        });
        const tokenData = await tokenResponse.json();

        // 2. Obtener perfil de osu!
        const userResponse = await fetch('https://osu.ppy.sh/api/v2/me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const osuUser = await userResponse.json();

        // 3. Guardar en tu tabla 'users'
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('users')
            .upsert({
                osu_id: osuUser.id,
                username: osuUser.username,
                avatar_url: osuUser.avatar_url,
            }, { onConflict: 'osu_id' })
            .select()
            .single();

        if (dbError) throw dbError;

        // 4. Crear tu propia cookie de sesión
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.set('cna_auth_session', dbUser.osu_id.toString(), {
            path: '/',
            httpOnly: false, // Permitimos que el cliente la lea
            maxAge: 60 * 60 * 24 * 7, // 1 semana
            sameSite: 'lax',
        });

        return response;

    } catch (err) {
        console.error(err);
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }
}