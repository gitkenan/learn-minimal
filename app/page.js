// app/page.js

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'; // Authentication components
import { Inter } from 'next/font/google';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Import AOS styles
import CreativityIcon from '../components/icons/CreativityIcon.jsx';
import LearningIcon from '../components/icons/LearningIcon.jsx';
import AmbitionIcon from '../components/icons/AmbitionIcon.jsx';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [topic, setTopic] = useState(''); // State for the input topic
  const [plan, setPlan] = useState(''); // State for the generated learning plan
  const [isLoading, setIsLoading] = useState(false); // State to show loading spinner
  const router = useRouter();

  // Initialize AOS animations
  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration
      once: true,     // Animate only once
    });
  }, []);

  // Handle form submission
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
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (data.plan && data.plan.id) {
        // Authenticated user gets a plan with an ID
        router.push(`/plan/${data.plan.id}`);
      } else if (data.plan) {
        // Unauthenticated user gets a plan without an ID
        setPlan(data.plan);
      } else {
        throw new Error('Invalid plan data received');
      }
    } catch (error) {
      console.error('Error during fetch:', error);
      alert('An error occurred while generating the plan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${inter.className} bg-black text-white`}>
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        {/* Main Heading */}
        <h1 className="text-6xl font-extrabold mb-8 leading-tight neon-text" data-aos="fade-up">
          Empower Your Mind,<br />Unlock Your <span className="text-white">Potential</span>
        </h1>
        {/* Subheading */}
        <p className="text-xl mb-12" data-aos="fade-up" data-aos-delay="200">
          Shape your future with custom-made learning plans.
        </p>
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center w-full max-w-xl" data-aos="fade-up" data-aos-delay="400">
          <input
            type="text"
            placeholder="Enter a topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="border border-neon-green bg-black rounded-full p-4 w-full text-center text-white text-lg transition-colors duration-300"
          />
          <button
            type="submit"
            className={`ml-4 px-6 py-4 rounded-full text-lg font-semibold disabled:opacity-50 neon-button ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Go'}
          </button>
        </form>

        {/* Loading Spinner */}
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

        {/* Display Generated Plan for Unauthenticated Users */}
        {plan && (
          <div className="mt-8 w-full max-w-xl bg-gray-100 p-4 rounded-md text-black">
            <h2 className="text-lg font-bold mb-2">Your Learning Plan:</h2>
            <p className="text-gray-900 whitespace-pre-line">{plan}</p>
            {/* Encourage Users to Sign Up */}
            <SignedOut>
              <p className="mt-4 text-sm text-gray-600">
                Want to save your learning plan?{' '}
                <Link href="/sign-up" className="text-blue-500">Sign up</Link> or{' '}
                <Link href="/sign-in" className="text-blue-500">log in</Link>!
              </p>
            </SignedOut>
          </div>
        )}
      </main>

      {/* Inspirational Sections */}
      <section className="py-20 bg-black" id="creativity">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 neon-text" data-aos="fade-right">
            Ignite Your <span className="text-white">Creativity</span>
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" data-aos="fade-right" data-aos-delay="200">
            “Creativity is intelligence having fun.” – Albert Einstein. Embrace the joy of learning and let your imagination soar.
          </p>
          <CreativityIcon className="mx-auto w-1/2" />
        </div>
      </section>

      <section className="py-20 bg-black" id="learning">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 neon-text" data-aos="fade-left">
            Embrace <span className="text-white">Continuous Learning</span>
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" data-aos="fade-left" data-aos-delay="200">
            “The beautiful thing about learning is that nobody can take it away from you.” – B.B. King. Invest in yourself every day.
          </p>
          <LearningIcon className="mx-auto w-1/2" />
        </div>
      </section>

      <section className="py-20 bg-black" id="ambition">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 neon-text" data-aos="fade-right">
            Reach for Your <span className="text-white">Ambitions</span>
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" data-aos="fade-right" data-aos-delay="200">
            “The future belongs to those who believe in the beauty of their dreams.” – Eleanor Roosevelt. Turn your dreams into reality.
          </p>
          <AmbitionIcon className="mx-auto w-1/2" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black text-center">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} Learn Minimal. All rights reserved.</p>
      </footer>
    </div>
  );
}
