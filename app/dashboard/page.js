// app/dashboard/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaEye, FaEllipsisV, FaTrash, FaShareAlt, FaEdit } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
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

        // Ensure plans is always an array
        const planArray = Array.isArray(data.plans) ? data.plans : [];
        console.log('Fetched plans:', planArray);
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
  }, [isLoaded, userId]);

  const handleDelete = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const res = await fetch('/api/plans', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      if (!res.ok) {
        throw new Error('Failed to delete plan');
      }

      setPlans(plans.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  // Filter plans based on search term
  const filteredPlans = plans.filter(plan => 
    plan?.topic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Rest of your Dashboard JSX remains the same */}
    </div>
  );
}