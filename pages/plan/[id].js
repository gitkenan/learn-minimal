// pages/plan/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';
import MarkdownPlan from '@/components/MarkdownPlan';
import LearningChat from '@/components/LearningChat';

export default function PlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPlan() {
      if (!id) return;

      setLoading(true);
      setError('');
      
      try {
        const supabase = initializeSupabase();
        if (!supabase) throw new Error('Failed to initialize Supabase client');

        const { data, error: supabaseError } = await supabase
          .from('plans')
          .select('*')
          .eq('id', id)
          .single();

        if (supabaseError) throw supabaseError;
        if (!data) throw new Error('Plan not found');
        if (data.user_id !== user?.id) throw new Error('Not authorized to view this plan');

        setPlan(data);
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchPlan();
  }, [id, user?.id]);

  const handleProgressUpdate = (newProgress) => {
    setPlan(prev => ({ ...prev, progress: newProgress }));
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading plan...</div>;
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-red-500">{error}</div>
        <Link href="/" className="text-accent hover:text-accent-hover transition-colors duration-200">
          ← Back to Home
        </Link>
      </div>
    );
  }
  if (!plan) return <div className="min-h-screen bg-background flex items-center justify-center">Plan not found</div>;

  // Determine which content to use - prefer json_content over content
  const planContent = plan.json_content || plan.content;
  const contentType = plan.json_content ? 'json' : 'markdown';

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{plan.topic} - Learn Minimal</title>
        <meta name="description" content={`Learning plan for ${plan.topic}`} />
      </Head>

      <div className="flex min-h-screen">
        {/* Chat Side Panel */}
        <div 
          className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-10
            ${isChatOpen ? 'w-96' : 'w-12'} flex flex-col`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="absolute -right-4 top-4 bg-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isChatOpen ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isChatOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} 
              />
            </svg>
          </button>

          {/* Minimized State Label */}
          {!isChatOpen && (
            <div className="h-full flex items-center justify-center">
              <span 
                className="text-gray-600 text-sm font-medium whitespace-nowrap transform -rotate-90"
                style={{ transformOrigin: 'center' }}
              >
                Learning Assistant
              </span>
            </div>
          )}

          {/* Chat Component */}
          <div 
            className={`absolute inset-0 transition-opacity duration-300 
              ${isChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {isChatOpen && (
              <LearningChat planId={plan.id} topic={plan.topic} />
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'ml-96' : 'ml-12'}`}>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8 flex items-center justify-between">
                <Link href="/" className="text-accent hover:text-accent-hover transition-colors duration-200">
                  ← Back to Home
                </Link>
                <span className="text-secondary text-sm">
                  Created {new Date(plan.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-surface p-8 rounded-lg shadow-claude">
                <h1 className="text-primary text-3xl font-semibold mb-6">{plan.topic}</h1>
                
                <MarkdownPlan 
                  initialContent={planContent}
                  planId={plan.id}
                  onProgressUpdate={handleProgressUpdate}
                  contentType={contentType}
                />

                <div className="mt-8 pt-8 border-t border-claude-border">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Progress</span>
                    <span className="text-primary font-medium">{plan.progress}%</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-accent h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}