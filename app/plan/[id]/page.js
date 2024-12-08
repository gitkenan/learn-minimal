// app/plan/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';

export default function PlanDetail() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
      return;
    }

    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPlan(data.plan);
      } catch (err) {
        setError('Failed to load plan');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPlan();
  }, [id, isLoaded, userId, router]);

  if (loading) return <div className="text-white text-center p-8">Loading...</div>;
  if (error) return <div className="text-red-400 text-center p-8">{error}</div>;
  if (!plan) return null;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{plan.topic}</h1>
        <div className="space-y-4 mb-8">
          {plan.content.split('\n').map((step, i) => (
            <div key={i} className="p-4 bg-gray-800 rounded">
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}