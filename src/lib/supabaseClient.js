import { createClient } from '@supabase/supabase-js';

// Public client (safe for browser) - Primarily for auth state, maybe reads if RLS allows
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Server client (uses service role - NEVER expose in browser)
// Use this ONLY in API routes or getServerSideProps/Server Actions
let supabaseServerClient = null;
export const getServerSupabaseClient = () => {
    if (!supabaseServerClient) {
         if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase URL or Service Role Key missing in environment variables.');
         }
         supabaseServerClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } } // No need to persist session for service role
        );
    }
    return supabaseServerClient;
};