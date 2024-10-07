// app/page.js

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/navigation'; // Import useRouter

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState('');
  const router = useRouter(); // Initialize the router

  const motivationalQuotes = [
    "Learning never exhausts the mind.",
    "The beautiful thing about learning is nobody can take it away from you.",
    "Education is the passport to the future.",
    // Add more quotes as desired
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (res.ok) {
        // Redirect to the plan detail page
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
    <div className={`min-h-screen bg-gray-900 text-gray-100 ${inter.className}`}>
      <nav className="container mx-auto px-4 py-4 flex justify-end">
        <SignedOut>
          <Link href="/sign-in" className="text-white mr-4">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-white">
            Sign Up
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold mb-8 text-center">
          What would you like to learn about today?
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Enter a topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="border border-gray-700 bg-gray-800 rounded-full p-3 w-full mb-4 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Get Learning Plan'}
          </button>
        </form>

        {isLoading && (
          <div className="mt-8 flex justify-center">
            {/* Spinner or loading indicator */}
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
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

        {/* Remove the plan display from here since plans are now managed in the dashboard */}
      </main>
    </div>
  );
}

