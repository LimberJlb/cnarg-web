import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Guarda la sesión en LocalStorage/Cookies para que no se cierre al refrescar
    detectSessionInUrl: true,  // Ayuda a Supabase a capturar la sesión justo después del redirect de osu!
    flowType: 'pkce',          // Usa el flujo más seguro (Proof Key for Code Exchange)
    storageKey: 'cnarg-auth', // Opcional: un nombre personalizado para que no choque con otros proyectos
  }
});