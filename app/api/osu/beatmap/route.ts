import { NextResponse } from 'next/server';

async function getOsuToken() {
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_OSU_CLIENT_ID, //
      client_secret: process.env.OSU_CLIENT_SECRET,    //
      grant_type: 'client_credentials',
      scope: 'public'
    })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error obteniendo Token de osu!:", data);
    throw new Error(data.error || 'Fallo al obtener token');
  }
  return data.access_token;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const beatmapId = searchParams.get('id');

  try {
    const token = await getOsuToken();
    const response = await fetch(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error de osu! API:", data);
      return NextResponse.json({ error: data.error || 'Mapa no encontrado' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error en el Puente:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}