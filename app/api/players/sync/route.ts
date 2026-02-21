import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { osuId } = await request.json();

        // 1. Configuración de clientes
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // Usamos la Service Key para bypass de RLS
        );

        // 2. Obtener Token de osu! (Client Credentials Flow)
        const authRes = await fetch('https://osu.ppy.sh/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.NEXT_PUBLIC_OSU_CLIENT_ID,
                client_secret: process.env.OSU_CLIENT_SECRET,
                grant_type: 'client_credentials',
                scope: 'public'
            })
        });
        const { access_token } = await authRes.json();

        // 3. Pedir datos del jugador a la API de osu!
        const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${osuId}/mania`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        
        if (!userRes.ok) throw new Error('Usuario no encontrado en osu!');
        const osuData = await userRes.json();

        const maniaStats = osuData.statistics;
        const rank4k = maniaStats.variants?.find((v: any) => v.variant === '4k')?.country_rank || null;

        // 4. Actualizar la tabla 'players' en Supabase
        const { error: updateError } = await supabase
            .from('players')
            .update({
                nickname: osuData.username,
                avatar_url: osuData.avatar_url,
                country_rank: rank4k,
            })
            .eq('osu_id', osuId);

        if (updateError) throw updateError;

        return NextResponse.json({ 
            success: true, 
            message: `Datos de ${osuData.username} actualizados correctamente.` 
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}