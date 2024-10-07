// app/dashboard/page.js

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  const [plans, setPlans] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      // Redirect to sign-in if not authenticated
      router.push('/sign-in');
    } else if (isLoaded && userId) {
      // Fetch the user's plans
      fetch('/api/plans')
        .then(res => res.json())
        .then(data => {
          setPlans(data.plans);
        })
        .catch(err => {
          console.error('Error fetching plans:', err);
        });
    }
  }, [isLoaded, userId]);

  const handleDelete = async (planId) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setPlans(plans.filter((plan) => plan.id !== planId));
      } else {
        alert(data.error || "Failed to delete the plan.");
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert("An error occurred while deleting the plan.");
    }
  };

  const handleShare = (planId) => {
    const shareLink = `${window.location.origin}/plan/${planId}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert("Plan link copied to clipboard!");
      })
      .catch(err => {
        console.error('Error copying share link:', err);
        alert("Failed to copy the share link.");
      });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="container mx-auto px-4 py-4 flex justify-between">
        <h1 className="text-2xl">My Learning Plans</h1>
        <div>
          <Link href="/">
            <button className="text-white mr-4">Home</button>
          </Link>
          <Link href="/sign-out">
            <button className="text-white">Sign Out</button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        {plans.length === 0 ? (
          <p className="text-center mt-8">You have no saved learning plans.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-gray-800 p-6 rounded-md">
                <h2 className="text-xl font-semibold mb-4">{plan.topic}</h2>
                <div className="space-x-4">
                  <Link href={`/plan/${plan.id}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                      View Plan
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Delete Plan
                  </button>
                  <button
                    onClick={() => handleShare(plan.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    Share Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
