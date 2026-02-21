import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import LoginButton from './LoginButton';

export default async function AuthNav() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cna_auth_session')?.value;

    if (!sessionId) {
        return <LoginButton />;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return <LoginButton />;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('username, avatar_url')
        .eq('id', sessionId)
        .single();

    if (error || !user) {
        return <LoginButton />;
    }

    return (
        <div className="flex items-center space-x-4 bg-[#fdc15a] hover:bg-[#d9953d] text-[#2e2e2e] h-full px-13 transition-colors duration-200 cursor-pointer">
            <span className="font-['ITCMachine'] text-[26px] mt-1">
                {user.username}
            </span>
            <img
                src={user.avatar_url || '/logo-4k.png'}
                alt={`${user.username} avatar`}
                className="w-10 h-10 rounded-full border-2 border-[#2e2e2e] object-cover shadow-sm"
            />
        </div>
    );
}
