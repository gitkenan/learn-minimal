"use client";

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import ProgressBar from '@badrap/bar-of-progress'; // Import ProgressBar

export default function Home() {
  const [topic, setTopic] = useState('');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState('');

  // Initialize ProgressBar
  const progress = new ProgressBar({
    size: 4,
    color: '#29e',
    className: 'bar-of-progress',
    delay: 100,
  });

  const motivationalQuotes = [
    "Learning never exhausts the mind.",
    "The beautiful thing about learning is nobody can take it away from you.",
    "Education is the passport to the future.",
    // Add more quotes as desired
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add loading bar
    setIsLoading(true);
    progress.start();
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (res.ok) {
        // Replace Markdown-style bold (**text**) and italic (*text*) with HTML tags
        let formattedPlan = data.plan
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Replace bold (**text**) with <strong>
          .replace(/\*(.*?)\*/g, '<em>$1</em>')            // Replace italic (*text*) with <em>
          .replace(/\n/g, '<br />');                       // Replace newlines with <br />
        setPlan(formattedPlan);
      } else {
        console.error('Error generating plan:', data.error);
      }
    } catch (error) {
      console.error('Error during fetch:', error);
    } finally {
      progress.finish();
      setIsLoading(false);
    }
  };

  return (
    <div>
      <nav className="flex justify-end p-4">
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 px-4">
        <h1 className="text-xl font-light mb-8 text-gray-300 text-center">
          What would you like to learn about today?
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-2xl">
          <input
            type="text"
            placeholder="Enter a topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="border border-gray-700 bg-gray-800 rounded-full p-3 w-full mb-4 text-center text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? 'Generating...' : 'Get Learning Plan'}
          </button>
        </form>
        {plan && (
          <div className="mt-8 w-96 bg-gray-100 p-4 rounded-md text-black max-h-96 overflow-y-scroll">
            <h2 className="text-lg font-bold mb-2">Your Learning Plan:</h2>
            <p className="text-gray-900" dangerouslySetInnerHTML={{ __html: plan }}></p>
          </div>
        )}
        {isLoading && (
          <div className="mt-8 w-full max-w-2xl bg-gray-800 p-4 rounded-md text-white">
            <p className="text-center">{quote}</p>
            {/* You can add a visual progress bar here if desired */}
            <div className="mt-4 flex justify-center">
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
          </div>
        )}
      </div>
    </div>
  );
}

