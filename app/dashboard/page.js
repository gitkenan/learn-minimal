"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
      return;
    }

    async function fetchPlans() {
      try {
        setLoading(true);
        const res = await fetch('/api/plans');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch plans');
        const planArray = Array.isArray(data.plans) ? data.plans : [];
        setPlans(planArray);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && userId) {
      fetchPlans();
    }
  }, [isLoaded, userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {plans.length === 0 ? (
        <p>No plans found.</p>
      ) : (
        <ul className="space-y-2">
          {plans.map((plan) => (
            <li key={plan.id} className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold">{plan.topic}</h3>
              <p className="text-sm text-gray-400">{new Date(plan.createdAt).toLocaleString()}</p>
              <Link href={`/plan/${plan.id}`}>
                <button className="mt-2 px-3 py-1 bg-blue-600 rounded text-white">
                  View Plan
                </button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
