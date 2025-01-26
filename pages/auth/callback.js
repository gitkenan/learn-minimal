import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabase } from '../../lib/supabaseClient';
import { Loading } from '../../components/ui/loading';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = getSupabase();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback started');
        console.log('Current URL:', window.location.href);

        // Get the initial session state
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Initial session check:', sessionData, sessionError);

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (sessionData?.session) {
          console.log('Session found immediately');
          return router.push('/');
        }

        // If no session, try to get the user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('User data check:', userData, userError);

        if (userError) {
          console.error('User error:', userError);
          throw userError;
        }

        if (!userData?.user) {
          throw new Error('No user found after authentication');
        }

        // One final session check
        const { data: finalSession } = await supabase.auth.getSession();
        if (finalSession?.session) {
          console.log('Session established on final check');
          return router.push('/');
        }

        throw new Error(
          'Failed to establish session. Please verify:\n' +
          '1. Supabase Auth settings include http://localhost:3000/auth/callback\n' +
          '2. Google OAuth includes http://localhost:3000 and http://localhost:3000/auth/callback\n' +
          '3. Browser cookies and local storage are enabled'
        );
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/auth?error=' + encodeURIComponent(error.message));
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading variant="spinner" size="lg" />
    </div>
  );
}