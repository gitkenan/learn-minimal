// components/Auth.js
import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Auth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const supabase = getSupabase();

  useEffect(() => {
    const urlError = router.query.error;
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [router.query]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting Google sign in...');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
      console.log('Google sign in initiated successfully');
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      console.log('Starting email sign in...');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session) {
        console.log('Session established, redirecting...');
        router.push('/');
      } else {
        throw new Error('Failed to establish session');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      console.log('Starting sign up...');
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      
      console.log('Sign up successful, confirmation email sent');
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="search-button flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>

      <div className="relative my-2">
        <hr className="border-gray-300" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500">
          or continue with email
        </span>
      </div>

      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="search-input"
      />
      <input
        type="password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="search-input"
      />
      
      {error && (
        <div className="p-4 text-red-500 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium">{error}</p>
          {error.includes('localhost:3000') && (
            <ul className="mt-2 text-sm list-disc list-inside">
              <li>Check Supabase Authentication {`>`} URL Configuration</li>
              <li>Check Google Cloud Console OAuth 2.0 credentials</li>
            </ul>
          )}
        </div>
      )}

      <button
        onClick={handleSignUp}
        disabled={loading}
        className="search-button"
      >
        {loading ? 'Loading...' : 'Sign Up'}
      </button>
      
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="search-button bg-gray-700 hover:bg-gray-800"
      >
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </div>
  )
}
