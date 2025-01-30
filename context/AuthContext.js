// context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);


  const refreshSession = async () => {
    console.log('Refreshing session...');
    try {
      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser()
      ]);
      
      const currentSession = sessionResult.data.session;
      const currentUser = userResult.data.user;

      if (sessionResult.error && !currentUser) {
        console.error('Session refresh error:', sessionResult.error);
        throw sessionResult.error;
      }

      console.log('Session refresh result:', 
        currentSession || currentUser ? 'Session/User found' : 'No session/user');
      
      setSession(currentSession);
      setUser(currentUser ?? currentSession?.user ?? null);
      return currentSession || (currentUser ? { user: currentUser } : null);
    } catch (error) {
      console.error('Error refreshing session:', error);
      setSession(null);
      setUser(null);
      return null;
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialSession = async () => {
      if (!isMounted) return;
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session load error:', error);
          throw error;
        }

        if (isMounted) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
          }
          setLoading(false);
          setSessionReady(true);
        }
      } catch (error) {
        console.error('Error loading initial session:', error);
      }
    };

    loadInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        console.log('Auth state change:', event, currentSession ? 'Session exists' : 'No session');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setSessionReady(true);

        if (event === 'SIGNED_IN') {
          console.log('User signed in:', currentSession?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    return () => {
      isMounted = false;
      console.log('Cleaning up auth subscriptions');
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  const value = {
    user,
    session,
    loading,
    refreshSession,
    signOut,
    sessionReady,
    supabase
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
