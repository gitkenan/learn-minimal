'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
      return;
    }

    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/plans');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPlans(data.plans);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPlans();
  }, [isLoaded, userId, router]);

  if (loading) return <div className="text-white text-center p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Learning Plans</h1>
        <div className="space-y-4">
          {plans.length === 0 ? (
            <p>No plans found.</p>
          ) : (
            plans.map((plan) => (
              <Link 
                key={plan.id} 
                href={`/plan/${plan.id}`}
                className="block p-4 bg-gray-800 rounded hover:bg-gray-700"
              >
                <h2 className="font-semibold">{plan.topic}</h2>
                <p className="text-sm text-gray-400">
                  {new Date(plan.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
