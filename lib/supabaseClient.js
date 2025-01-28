// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function initializeSupabase() {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined
        }
    });

    return supabaseInstance;
}

export const getSupabase = () => {
    if (!supabaseInstance) {
        return initializeSupabase();
    }
    return supabaseInstance;
};
