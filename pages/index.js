import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';

export default function Home() {
  const { user, session, loading } = useAuth();
  const [topic, setTopic] = useState('');
  const [timeline, setTimeline] = useState('');
  const [experience, setExperience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          topic, 
          timeline: timeline.trim() || 'flexible timeline',
          experience: experience.trim() || 'not specified'
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await res.json();
      router.push(`/plan/${data.plan.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-soft">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-center bg-gradient-to-r from-[#3c6e47] to-[#98c3a4] bg-clip-text text-transparent">
              Welcome to Learn Minimal
            </h1>
            <p className="text-secondary text-center mb-8 text-base md:text-lg lg:text-xl opacity-80">
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
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
          <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-soft">
          <div className="mb-8 text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-2 bg-gradient-to-r from-[#3c6e47] to-[#98c3a4] bg-clip-text text-transparent">
              Learn Minimal
            </h1>
            <p className="text-secondary text-base md:text-lg lg:text-xl opacity-80">
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
                className="search-input bg-background"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-center gap-2 text-accent hover:text-accent-hover transition-colors duration-200"
              >
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
                <svg 
                  className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showAdvanced && (
                <>
                  <textarea
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Tell us about your experience with this topic (optional)"
                    className="search-input bg-background min-h-[100px]"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="How much time do you have? (optional)"
                    className="search-input bg-background"
                    disabled={isLoading}
                  />
                </>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !topic.trim() || loading}
              className="search-button w-full disabled:opacity-50 flex items-center justify-center"
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
