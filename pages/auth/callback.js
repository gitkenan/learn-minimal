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

        // Exchange code for session using query parameters
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(
          window.location.search.substring(1)
        );

        if (error) {
          console.error('Exchange error:', error);
          throw error;
        }

        if (!session) {
          throw new Error('No session returned from code exchange');
        }

        // Set session in local storage
        window.localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        }));

        console.log('Session established successfully');
        return router.push('/');
      } catch (error) {
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
