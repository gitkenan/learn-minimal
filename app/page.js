// app/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
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
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError('Please enter a topic to learn about');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmedTopic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (data.plan && data.plan.id) {
        setSuccessMessage('Plan created successfully! Redirecting...');
        setTimeout(() => {
          router.push(`/plan/${data.plan.id}`);
        }, 1000);
      } else {
        throw new Error('Invalid plan data received');
      }
    } catch (error) {
      console.error('Error during plan generation:', error);
      setError(error.message === 'Failed to fetch' 
        ? 'Network error. Please check your connection and try again.'
        : error.message || 'An error occurred while generating the plan.');
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
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-full \
                ${isLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'} \
                text-white font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? <LoadingSpinner /> : 'Generate Plan'}
            </button>
          </div>
          {error && <div className="text-red-400 text-sm p-3 rounded-lg bg-red-400/10 text-center" role="alert">{error}</div>}
          {successMessage && <div className="text-green-400 text-sm p-3 rounded-lg bg-green-400/10 text-center" role="status">{successMessage}</div>}
        </form>
      </main>
    </div>
  );
}