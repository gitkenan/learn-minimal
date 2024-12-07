// app/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { storage } from '../lib/storage';
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

      if (!data.plan || !data.plan.id || !data.plan.content || !data.plan.topic) {
        console.error('Invalid plan data:', data);
        throw new Error('Invalid plan data received');
      }

      // Create the complete plan object
      const completePlan = {
        id: data.plan.id,
        topic: trimmedTopic,
        content: data.plan.content,
        createdAt: new Date().toISOString(),
        progress: {}
      };

      try {
        console.log('Saving plan to storage:', { userId, planId: data.plan.id });
        // Save to local storage
        if (!storage.initStorage()) {
          console.error('Storage not available');
          throw new Error('Storage is not available');
        }
        
        const saved = storage.savePlan(userId, data.plan.id, completePlan);
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

        console.log('Plan saved successfully:', verifiedPlan);
        setSuccessMessage('Plan created successfully! Redirecting...');
        
        // Add a small delay to ensure storage is synced
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to the plan page
        router.push(`/plan/${data.plan.id}`);
      } catch (storageError) {
        console.error('Storage error:', storageError);
        throw new Error('Failed to save plan: ' + storageError.message);
      }
    } catch (error) {
      console.error('Error during plan generation:', error);
      setError(error.message || 'An error occurred while generating the plan.');
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center" data-aos="fade-up">
          Learn Anything
        </h1>
        
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4" data-aos="fade-up" data-aos-delay="200">
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setError('');
              }}
              placeholder="Enter a topic to learn..."
              className="w-full px-6 py-4 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-neon-green transition-all duration-300"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-full 
                ${isLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'} 
                text-white font-semibold transition-all duration-300`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <LoadingSpinner />
                  <span className="ml-2">Generating...</span>
                </span>
              ) : (
                'Generate Plan'
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm p-3 rounded-lg bg-red-400/10 text-center" role="alert">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-green-400 text-sm p-3 rounded-lg bg-green-400/10 text-center" role="status">
              {successMessage}
            </div>
          )}
        </form>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          {[
            {
              title: 'AI-Powered',
              description: 'Get personalized learning plans generated in seconds'
            },
            {
              title: 'Track Progress',
              description: 'Monitor your learning journey with interactive checkpoints'
            },
            {
              title: 'Expand Knowledge',
              description: 'Dive deeper into topics with detailed explanations'
            }
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 bg-gray-800/50 rounded-lg text-center"
              data-aos="fade-up"
              data-aos-delay={300 + index * 100}
            >
              <h3 className="text-xl font-semibold mb-2 text-neon-green">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}