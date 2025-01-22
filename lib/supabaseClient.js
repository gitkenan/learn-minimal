// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function initializeSupabase() {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    function validateEnvironmentVariables() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        const errors = []

        if (!supabaseUrl) {
            errors.push('Missing NEXT_PUBLIC_SUPABASE_URL')
        }
        if (!supabaseKey) {
            errors.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
        }

        if (errors.length > 0) {
            throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
        }

        return { supabaseUrl, supabaseKey }
    }

    const { supabaseUrl, supabaseKey } = validateEnvironmentVariables();
    const options = {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        global: {
            fetch: (...args) => {
                return fetch(...args).catch(error => {
                    console.error('Supabase request failed:', error)
                    throw error
                })
            }
        }
    };

    // Add client-side specific options
    if (typeof window !== 'undefined') {
        options.auth.storage = {
            setItem: (key, value) => {
                document.cookie = `${key}=${value}; path=/`;
            },
            getItem: (key) => {
                const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                    const [name, value] = cookie.trim().split('=');
                    acc[name] = value;
                    return acc;
                }, {});
                return cookies[key] || null;
            },
            removeItem: (key) => {
                document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            },
        };
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, options);
    return supabaseInstance;
}
