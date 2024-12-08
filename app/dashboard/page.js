// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const { userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    fetch('/api/plan')
      .then(res => res.json())
      .then(data => setPlans(data.plans))
      .catch(console.error);
  }, [userId, router]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl mb-4">Your Plans</h1>
        <div className="space-y-4">
          {plans.map(plan => (
            <Link 
              key={plan.id} 
              href={`/plan/${plan.id}`}
              className="block p-4 bg-gray-800 rounded hover:bg-gray-700"
            >
              <h2>{plan.topic}</h2>
              <p className="text-sm text-gray-400">
                {new Date(plan.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}