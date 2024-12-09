// app/page.js

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Import AOS styles
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [topic, setTopic] = useState('');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Rate limit reached. Please wait a moment and try again.');
        }
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (!data.plan) {
        throw new Error('Invalid plan data received');
      }

      if (data.plan.id) {
        router.push(`/plan/${data.plan.id}`);
      } else {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Error during fetch:', error);
      setError(error.message || 'An error occurred while generating the plan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${inter.className} bg-black text-white`}>
      <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-4xl font-bold mb-6" data-aos="fade-up">
          Learn Anything
        </h1>
        
        <form onSubmit={handleSubmit} className="w-full max-w-md" data-aos="fade-up" data-aos-delay="200">
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic to learn..."
              className="w-full px-6 py-4 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Plan'
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>

        {plan && !plan.id && (
          <div className="mt-8 w-full max-w-2xl bg-gray-800 p-6 rounded-lg" data-aos="fade-up">
            <h2 className="text-2xl font-bold mb-4">{plan.topic}</h2>
            <div className="whitespace-pre-wrap text-left">{plan.content}</div>
          </div>
        )}
      </main>
    </div>
  );
}
