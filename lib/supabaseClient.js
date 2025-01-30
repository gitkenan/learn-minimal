// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function validateEnvironmentVariables() {
  const errors = [];
  if (!supabaseUrl) errors.push('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) errors.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

// Create a single instance with consistent options
const options = {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
      }
    }
  }
};

validateEnvironmentVariables();
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);