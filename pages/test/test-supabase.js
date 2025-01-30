// pages/test-supabase.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Import

export default function TestSupabase() {
  const [status, setStatus] = useState('Trying to sign in...');
  const [sessionInfo, setSessionInfo] = useState({});

  useEffect(() => {
    const signIn = async () => {
      if (!supabase) {
        setStatus('Failed to initialize Supabase client.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ken.alshamie@gmail.com', // Replace with your test account
        password: 'alshamie01', // Replace with your test password
      });

      if (error) {
        setStatus('Sign in error: ' + error.message);
        setSessionInfo({});
      } else {
        setStatus('Signed in successfully. Check console for details.');
        setSessionInfo({
          hasSession: !!data.session,
          hasAccessToken: !!data.session?.access_token,
          hasRefreshToken: !!data.session?.refresh_token,
          userId: data.session?.user?.id,
          email: data.session?.user?.email,
        });
      }
    };

    signIn();
  }, []);

  return (
    <div>
      <p>Status: {status}</p>
      <p>Session Information:</p>
      <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
    </div>
  );
}