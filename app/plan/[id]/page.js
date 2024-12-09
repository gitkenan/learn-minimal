// app/plan/[id]/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { storage } from '../../../lib/storage';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function PlanDetail() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !userId || !id) return;

    const fetchPlan = async () => {
      try {
        console.log('Fetching plan:', { userId, planId: id });
        
        // First try to get from storage
        if (storage.initStorage()) {
          const storedPlan = storage.getPlan(userId, id);
          if (storedPlan) {
            console.log('Found plan in storage:', storedPlan);
            setPlan(storedPlan);
            setLoading(false);
            return;
          }
        }

        console.log('Plan not found in storage, fetching from API');
        const res = await fetch(`/api/plans/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch plan');
        }

        if (!data.plan) {
          throw new Error('Plan not found');
        }

        console.log('Received plan from API:', data.plan);
        setPlan(data.plan);
        
        // Save to storage for future
        if (storage.initStorage()) {
          storage.savePlan(userId, id, data.plan);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [isLoaded, userId, id]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="text-center">
          <h2 className="text-xl mb-4">Error Loading Plan</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="text-center">
          <h2 className="text-xl mb-4">Plan Not Found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{plan.topic}</h1>
          <div className="space-y-4">
            {plan.content.split('\n')
              .filter(line => line.trim())
              .map((step, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(marked(step))
                    }}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}