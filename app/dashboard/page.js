// app/dashboard/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
      return;
    }

    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/plans');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch plans');
        }

        const planArray = Array.isArray(data.plans) ? data.plans : [];
        setPlans(planArray);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && userId) {
      fetchPlans();
    }
  }, [isLoaded, userId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-gray-200 p-4">
        <div className="text-center py-8">
          <h2 className="text-xl text-red-400 mb-4">Error loading plans</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredPlans = plans.filter(plan => 
    plan?.topic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Add UI to display and filter plans as needed */}
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="p-4">
          <input
            type="text"
            placeholder="Search topics..."
            className="mb-4 px-3 py-2 bg-gray-800 text-white rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredPlans.length === 0 ? (
            <p>No plans found.</p>
          ) : (
            <ul className="space-y-2">
              {filteredPlans.map((plan) => (
                <li key={plan.id} className="p-4 bg-gray-800 rounded shadow">
                  <h3 className="text-lg font-bold">{plan.topic}</h3>
                  <p className="text-sm text-gray-400">{new Date(plan.createdAt).toLocaleString()}</p>
                  <Link href={`/plan/${plan.id}`}>
                    <button className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                      View Plan
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
