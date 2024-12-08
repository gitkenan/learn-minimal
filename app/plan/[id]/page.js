"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';

export default function PlanDetail() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
      return;
    }
    if (isLoaded && userId) {
      fetchPlan();
    }

    async function fetchPlan() {
      try {
        setLoading(true);
        const res = await fetch(`/api/plans/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch plan');
        setPlan(data.plan);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [isLoaded, userId, id, router]);

  const handleSave = async () => {
    // In this simplified version, the plan is assumed already saved at creation.
    // This button could trigger a re-save if needed, but here we simply do nothing
    // or show a message. For now, just a console log:
    console.log('Plan is already saved upon creation.');
  };

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

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-xl font-bold">{plan.topic}</h1>
        <div className="whitespace-pre-wrap bg-gray-800 p-4 rounded">{plan.content}</div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 rounded text-white"
        >
          Save Plan
        </button>
      </div>
    </div>
  );
}
