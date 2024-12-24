import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';

export default function PlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPlan() {
      try {
        // Don't fetch if we don't have an ID yet
        if (!id) return;

        setLoading(true);
        setError('');
        
        // Initialize Supabase client
        const supabase = initializeSupabase();
        
        if (!supabase) {
          throw new Error('Failed to initialize Supabase client');
        }

        const { data, error: supabaseError } = await supabase
          .from('plans')
          .select('*')
          .eq('id', id)
          .single();

        if (supabaseError) throw supabaseError;

        if (!data) {
          throw new Error('Plan not found');
        }

        // Make sure the user owns this plan
        if (data.user_id !== user?.id) {
          throw new Error('Not authorized to view this plan');
        }

        setPlan(data);
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPlan();
    }
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading plan...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-red-500">{error}</div>
        <Link 
          href="/"
          className="text-accent hover:text-accent-hover transition-colors duration-200"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Plan not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{plan.topic} - Learn Minimal</title>
        <meta name="description" content={`Learning plan for ${plan.topic}`} />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <Link 
              href="/"
              className="text-accent hover:text-accent-hover transition-colors duration-200"
            >
              ← Back to Home
            </Link>
            <span className="text-secondary text-sm">
              Created {new Date(plan.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Plan Content */}
          <div className="bg-surface p-8 rounded-lg shadow-claude">
            <h1 className="text-primary text-3xl font-semibold mb-6">
              {plan.topic}
            </h1>
            
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-primary">
                {plan.content}
              </pre>
            </div>

            {/* Progress section */}
            <div className="mt-8 pt-8 border-t border-claude-border">
              <div className="flex items-center justify-between">
                <span className="text-secondary">Progress</span>
                <span className="text-primary font-medium">
                  {plan.progress}%
                </span>
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
      </main>
    </div>
  );
}