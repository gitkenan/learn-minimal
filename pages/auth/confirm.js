// pages/auth/confirm.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { initializeSupabase } from '@/lib/supabaseClient';

export default function ConfirmEmail() {
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState(null);
  const { token_hash, type } = router.query;

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token_hash || !type) {
        setError('Invalid confirmation link');
        return;
      }

      try {
        const supabase = initializeSupabase();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type
        });

        if (verifyError) throw verifyError;

        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.message);
      }
    };

    if (router.isReady) {
      verifyEmail();
    }
  }, [router.isReady, token_hash, type, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full bg-surface p-8 rounded-lg shadow-claude">
        {error ? (
          <div className="text-red-500 text-center">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Email Confirmation</h2>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}