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
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      // Redirect to sign-in if not authenticated
      router.push('/sign-in');
    } else if (isLoaded && userId) {
      // Fetch the user's plans
      fetch('/api/plans')
        .then((res) => res.json())
        .then((data) => {
          setPlans(data.plans);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching plans:', err);
          setLoading(false);
        });
    }
  }, [isLoaded, userId]);

  const handleDelete = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setPlans(plans.filter((plan) => plan.id !== planId));
      } else {
        alert(data.error || 'Failed to delete the plan.');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('An error occurred while deleting the plan.');
    }
  };

  const handleShare = (planId) => {
    const shareLink = `${window.location.origin}/plan/${planId}`;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        alert('Plan link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Error copying share link:', err);
        alert('Failed to copy the share link.');
      });
  };

  const handleEdit = (planId, topic) => {
    setEditingPlan(planId);
    setEditedTitle(topic);
  };

  const handleSaveEdit = async (planId) => {
    try {
      const res = await fetch(`/api/plans`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, topic: editedTitle }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlans(plans.map((plan) => (plan.id === planId ? { ...plan, topic: editedTitle } : plan)));
        setEditingPlan(null);
      } else {
        alert(data.error || 'Failed to update the plan.');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('An error occurred while updating the plan.');
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDropdown = (planId) => {
    setDropdownOpen(dropdownOpen === planId ? null : planId);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Learn Minimal Dashboard</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Link href="/">
            <button className="text-teal-500 hover:underline">Home</button>
          </Link>
          <Link href="/sign-out">
            <button className="text-teal-500 hover:underline">Sign Out</button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : filteredPlans.length === 0 ? (
          <p className="text-center mt-8">You have no saved learning plans.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-gray-800 p-6 rounded-md shadow-md hover:shadow-lg transition-shadow relative">
                {editingPlan === plan.id ? (
                  <div>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full px-3 py-2 mb-2 rounded bg-gray-700 text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(plan.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <h2 className="text-2xl font-semibold mb-2 text-teal-400">{plan.topic}</h2>
                )}
                <p className="text-sm text-gray-400 mb-4">Created on: {new Date(plan.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="flex items-center justify-between">
                  <Link href={`/plan/${plan.id}`}>
                    <button className="flex items-center bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded transition">
                      <FaEye className="mr-2" /> View Plan
                    </button>
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(plan.id)}
                      className="text-white focus:outline-none"
                    >
                      <FaEllipsisV />
                    </button>
                    {dropdownOpen === plan.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-gray-700 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => handleShare(plan.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-600 transition"
                        >
                          <FaShareAlt className="mr-2" /> Share
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-600 transition"
                        >
                          <FaTrash className="mr-2" /> Delete
                        </button>
                        <button
                          onClick={() => handleEdit(plan.id, plan.topic)}
                          className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-600 transition"
                        >
                          <FaEdit className="mr-2" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
