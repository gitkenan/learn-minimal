// app/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { storage } from '../lib/storage';  // Add this import
import AOS from 'aos';
import 'aos/dist/aos.css';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('Please sign in to create a learning plan');
      return;
    }
    
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError('Please enter a topic to learn about');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // Generate the plan
      console.log('Generating plan for:', trimmedTopic);
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmedTopic }),
      });

      const data = await res.json();
      console.log('Received data:', data);
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (!data.plan || !data.plan.id) {
        throw new Error('Invalid plan data received');
      }

      try {
        console.log('Saving plan to storage:', { userId, planId: data.plan.id });
        // Save to local storage
        if (!storage.initStorage()) {
          console.error('Storage not available');
          throw new Error('Storage is not available');
        }
        
        const saved = storage.savePlan(userId, data.plan.id, data.plan);
        if (!saved) {
          console.error('Failed to save plan to storage');
          throw new Error('Failed to save plan to storage');
        }

        // Verify the save
        const verifiedPlan = storage.getPlan(userId, data.plan.id);
        if (!verifiedPlan) {
          console.error('Plan verification failed');
          throw new Error('Failed to verify saved plan');
        }

        console.log('Plan saved successfully');
      } catch (storageError) {
        console.error('Storage error:', storageError);
        throw new Error('Failed to save plan: ' + storageError.message);
      }

      setSuccessMessage('Plan created successfully! Redirecting...');
      
      // Add a small delay to ensure storage is synced
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to the plan page
      router.push(`/plan/${data.plan.id}`);
    } catch (error) {
      console.error('Error during plan generation:', error);
      setError(error.message || 'An error occurred while generating the plan.');
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };
};

  // Rest of the component remains the same...