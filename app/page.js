"use client";

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a topic.');
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/plan/${data.planId}`);
      } else {
        console.error('Error generating plan:', data.error);
        alert(data.error || 'Failed to generate the plan.');
      }
    } catch (error) {
      console.error('Error during fetch:', error);
      alert("An error occurred while generating the plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${inter.className} bg-black text-gray-83`}>
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <SignedOut>
            <Link href="/sign-in" className="text-gray-400 hover:text-gray-200 font-medium">
              Sign In
            </Link>
            <Link href="/sign-up" className="bg-gray-800 text-gray-200 px-4 py-2 rounded-full font-medium hover:bg-gray-700">
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <div className="absolute top-4 right-4">
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <h1 className="text-5xl font-extrabold mb-6 leading-tight">
          Get a new learning plan, <br /> in <span className="text-neon-green">seconds</span>
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Discover personalized learning plans tailored just for you.
        </p>
        <form onSubmit={handleSubmit} className="flex items-center w-full max-w-lg">
          <input
            type="text"
            placeholder="Enter a topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="border border-gray-700 bg-gray-800 rounded-full p-4 w-full text-center text-gray-200 focus:outline-none focus:ring-2 focus:ring-neon-green text-lg transition-colors duration-300"
          />
          <button
            type="submit"
            className="bg-gray-800 text-gray-200 px-6 py-4 rounded-full ml-4 text-lg font-semibold hover:bg-neon-green hover:text-black transition-colors duration-300 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Go'}
          </button>
        </form>

        {isLoading && (
          <div className="mt-8 flex justify-center">
            <svg
              className="animate-spin h-12 w-12 text-neon-green"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          </div>
        )}
      </main>
    </div>
  );
}
