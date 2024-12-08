"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoaded || !userId) {
      setError('Please sign in to create a plan');
      return;
    }

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError('Please enter a topic');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmedTopic }),
      });
      const data = await res.json();

      if (!res.ok || !data.plan || !data.plan.id) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      router.push(`/plan/${data.plan.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setError('');
          }}
          placeholder="Enter a topic..."
          className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="w-full px-3 py-2 bg-blue-600 rounded text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Plan'}
        </button>
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
      </form>
    </div>
  );
}
