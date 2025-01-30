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
        
        // Check for linking query param
        const isLinking = new URLSearchParams(window.location.search).has('is_linking');

        const { data: { session, user }, error } = await supabase.auth.exchangeCodeForSession(
          window.location.search.substring(1)
        );

        if (error) {
          // Handle email conflict error
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in using your original method first.');
          }
          throw error;
        }

        if (!session) throw new Error('No session returned from code exchange');

        // Handle account linking scenario
        if (isLinking) {
          const { error: linkError } = await supabase.auth.linkIdentity({
            provider: 'google'
          });
          
          if (linkError) throw linkError;
          return router.push('/account-settings');
        }

        console.log('Session established successfully');
        return router.push('/');
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
