// app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/plan/${data.plan.id}`);
    } catch (error) {
      alert('Failed to create plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-4xl text-white text-center">Learn Anything</h1>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Enter a topic..."
          className="w-full p-2 rounded bg-gray-800 text-white"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 rounded bg-blue-600 text-white disabled:bg-gray-600"
        >
          {loading ? 'Creating...' : 'Create Plan'}
        </button>
      </form>
    </div>
  );
}