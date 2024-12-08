
// app/plan/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';

export default function PlanDetail() {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    async function loadPlan() {
      try {
        const res = await fetch(`/api/plan/${id}`);
        if (!res.ok) throw new Error('Failed to load plan');
        const data = await res.json();
        setPlan(data.plan);
      } catch (err) {
        setError('Could not load plan');
      }
    }

    loadPlan();
  }, [id, userId, router]);

  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!plan) return null;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl mb-4">{plan.topic}</h1>
        <div className="space-y-4">
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