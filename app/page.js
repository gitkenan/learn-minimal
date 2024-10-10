"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Import AOS styles
import CreativityIcon from '../components/icons/CreativityIcon';
import LearningIcon from '../components/icons/LearningIcon';
import AmbitionIcon from '../components/icons/AmbitionIcon';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Initialize AOS
    useEffect(() => {
        AOS.init({
            duration: 1000, // Animation duration
            once: true, // Whether animation should happen only once while scrolling
        });
    }, []);

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
        <div className={`min-h-screen ${inter.className} bg-black text-gray-200`}>
            {/* Navigation */}
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

            {/* Hero Section */}
            <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <h1 className="text-5xl font-extrabold mb-6 leading-tight" data-aos="fade-up">
                    Empower Your Mind, <br /> Unlock Your <span className="text-neon-green">Potential</span>
                </h1>
                <p className="text-lg text-gray-400 mb-8" data-aos="fade-up" data-aos-delay="200">
                    Discover personalized learning plans tailored just for you.
                </p>
                <form onSubmit={handleSubmit} className="flex items-center w-full max-w-lg" data-aos="fade-up" data-aos-delay="400">
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

            {/* Inspirational Sections */}
            <section className="py-20 bg-gray-900" id="creativity">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6" data-aos="fade-right">
                        Ignite Your <span className="text-neon-green">Creativity</span>
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto" data-aos="fade-right" data-aos-delay="200">
                        "Creativity is intelligence having fun." – Albert Einstein. Embrace the joy of learning and let your imagination soar.
                    </p>
                    <CreativityIcon className="mx-auto w-1/2" />
                </div>
            </section>

            <section className="py-20 bg-gray-800" id="learning">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6" data-aos="fade-left">
                        Embrace <span className="text-neon-green">Continuous Learning</span>
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto" data-aos="fade-left" data-aos-delay="200">
                        "The beautiful thing about learning is that nobody can take it away from you." – B.B. King. Invest in yourself every day.
                    </p>
                    <LearningIcon className="mx-auto w-1/2" />
                </div>
            </section>

            <section className="py-20 bg-gray-900" id="ambition">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6" data-aos="fade-right">
                        Reach for Your <span className="text-neon-green">Ambitions</span>
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto" data-aos="fade-right" data-aos-delay="200">
                        "The future belongs to those who believe in the beauty of their dreams." – Eleanor Roosevelt. Turn your dreams into reality.
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
