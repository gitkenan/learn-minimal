import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { WorkflowProvider } from '@/context/WorkflowContext';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import { Loading } from '@/components/ui/loading';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    // Ensure client-side auth state syncs with cookies
    if (typeof window !== 'undefined') {
      supabase.auth.startAutoRefresh();
    }

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <WorkflowProvider>
          <Layout>
            {isLoading && (
              <div className="fixed top-0 left-0 w-full h-1 z-50">
                <Loading variant="shimmer" className="w-full bg-opacity-50" />
              </div>
            )}
            <Component {...pageProps} />
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable={false}
              pauseOnHover
              theme="light"
            />
          </Layout>
        </WorkflowProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
