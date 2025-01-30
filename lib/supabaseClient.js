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
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [name, value] = cookie.split('=');
          acc[name.trim()] = decodeURIComponent(value);
          return acc;
        }, {});
        return cookies[key] || null;
      },
      setItem: (key, value) => {
        if (typeof document === 'undefined') return;
        document.cookie = `${key}=${encodeURIComponent(value)}; path=/; samesite=lax; secure`;
      },
      removeItem: (key) => {
        if (typeof document === 'undefined') return;
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  }
};

validateEnvironmentVariables();
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);
