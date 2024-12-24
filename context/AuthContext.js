// context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { initializeSupabase } from '@/lib/supabaseClient'; // Import the function

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [supabase, setSupabase] = useState(null); // Add supabase client state

  const refreshSession = async () => {
    if (!supabase) return null;
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      return currentSession;
    } catch (error) {
      console.error('Error refreshing session:', error);
      setSession(null);
      setUser(null);
      return null;
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Initialize the client on the client-side
    const supabaseClient = initializeSupabase();
    setSupabase(supabaseClient);

    const loadInitialSession = async () => {
      if (!supabaseClient) return;
      try {
        await refreshSession();
      } finally {
        setLoading(false);
      }
    };

    loadInitialSession();

    const authStateChangeSub = supabaseClient?.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setSessionReady(true); // Mark session as ready after initial auth state is known
      }
    );

    return () => {
      authStateChangeSub?.data?.subscription.unsubscribe();
    }
  }, []);

  const value = {
    user,
    session,
    loading,
    refreshSession,
    signOut,
    sessionReady
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};