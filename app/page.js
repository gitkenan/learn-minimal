'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { userId } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      router.push(`/plan/${data.plan.id}`);
    } catch (err) {
      setError('Failed to generate plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-4xl text-white text-center mb-8">Learn Anything</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic to learn..."
            className="w-full px-4 py-2 rounded bg-gray-800 text-white"
            disabled={isLoading}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Generating...' : 'Generate Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}