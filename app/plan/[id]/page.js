// app/plan/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';

export default function PlanDetail() {
  const [plan, setPlan] = useState(null);
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    fetch(`/api/plans/${id}`)
      .then(res => res.json())
      .then(data => setPlan(data.plan))
      .catch(console.error);
  }, [id, userId, router]);

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