import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Loading } from '@/components/ui/loading';

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
      <div className="min-h-screen bg-[#f8faf9] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#e8f0eb] to-transparent"></div>
        <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen relative">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 text-center bg-gradient-to-r from-[#3c6e47] to-[#98c3a4] bg-clip-text text-transparent">
            Learn Minimal
          </h1>
          <p className="text-[#3c6e47]/80 text-center mb-8 text-lg md:text-xl lg:text-2xl max-w-2xl">
            Please sign in to create and manage your learning plans.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="px-8 py-3 text-[#3c6e47] hover:text-[#98c3a4] transition-colors duration-200"
          >
            Sign In
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8f0eb] to-transparent"></div>
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] relative">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 text-center bg-gradient-to-r from-[#3c6e47] to-[#98c3a4] bg-clip-text text-transparent">
          Learn Minimal
        </h1>
        <p className="text-[#3c6e47]/80 text-center mb-12 text-lg md:text-xl lg:text-2xl max-w-2xl">
          Generate your personalized learning plan
        </p>
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic to learn about..."
                className="w-full px-4 py-3 bg-white border border-[#3c6e47]/20 rounded-lg text-[#3c6e47] placeholder-[#3c6e47]/50 focus:outline-none focus:border-[#3c6e47] transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-center gap-2 text-[#3c6e47]/70 hover:text-[#3c6e47] transition-colors duration-200"
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
                    className="w-full px-4 py-3 bg-white border border-[#3c6e47]/20 rounded-lg text-[#3c6e47] placeholder-[#3c6e47]/50 focus:outline-none focus:border-[#3c6e47] transition-all duration-200 min-h-[100px]"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="How much time do you have? (optional)"
                    className="w-full px-4 py-3 bg-white border border-[#3c6e47]/20 rounded-lg text-[#3c6e47] placeholder-[#3c6e47]/50 focus:outline-none focus:border-[#3c6e47] transition-all duration-200"
                    disabled={isLoading}
                  />
                </>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-sm mt-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !topic.trim() || loading}
              className="w-full px-6 py-3 bg-[#3c6e47] hover:bg-[#98c3a4] text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:bg-[#3c6e47]/50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loading
                    variant="spinner"
                    size="sm"
                    className="text-white -ml-1 mr-3"
                  />
                  Generating...
                </>
              ) : (
                'Generate Learning Plan'
              )}
            </button>
          </form>
        </main>
      </div>
  );
}
