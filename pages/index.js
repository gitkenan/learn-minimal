import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';

export default function Home() {
  const { user, session, loading } = useAuth();
  const [topic, setTopic] = useState('');
  const [timeline, setTimeline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ topic, timeline }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      router.push(`/plan/${data.plan.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render welcome screen for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-claude">
            <h1 className="text-primary text-3xl font-semibold mb-4 text-center">
              Welcome to Learn Minimal
            </h1>
            <p className="text-secondary text-center mb-8">
              Please sign in to create and manage your learning plans.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push('/auth')}
                className="search-button"
              >
                Sign In
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Learn Minimal</title>
        <meta name="description" content="Generate personalized learning plans" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="bg-surface shadow-claude">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-primary font-semibold">Learn Minimal</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-secondary hover:text-primary transition-colors duration-200"
            >
              Dashboard
            </button>
            <span className="text-secondary">{user.email}</span>
            <button
              onClick={async () => {
                const supabase = initializeSupabase();
                if (supabase) {
                  await supabase.auth.signOut();
                  router.push('/auth');
                }
              }}
              className="px-4 py-2 text-secondary hover:text-primary transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-claude">
          <div className="mb-8 text-center">
            <h1 className="text-primary text-3xl font-semibold mb-2">
              Learn Minimal
            </h1>
            <p className="text-secondary text-lg">
              Generate your personalized learning plan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic to learn about..."
                className="w-full p-4 text-primary bg-background border border-claude-border 
                         rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                         transition-colors duration-200"
                disabled={isLoading}
              />
              <input
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="How much time do you have? (e.g., '2 weeks', '3 months')"
                className="w-full p-4 text-primary bg-background border border-claude-border 
                         rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                         transition-colors duration-200"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !topic.trim() || !timeline.trim() || loading}
              className="w-full p-4 bg-accent hover:bg-accent-hover text-white rounded-lg
                       transition-colors duration-200 disabled:opacity-50
                       font-medium text-base flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Learning Plan'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}