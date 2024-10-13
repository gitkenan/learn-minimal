// app/page.js

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css'; // Import AOS styles
import CreativityIcon from '../components/icons/CreativityIcon.jsx';
import LearningIcon from '../components/icons/LearningIcon.jsx';
import AmbitionIcon from '../components/icons/AmbitionIcon.jsx';

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
        <div className={`min-h-screen ${inter.className} bg-black text-white`}>
            {/* Hero Section */}
            <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <h1 className="text-6xl font-extrabold mb-8 leading-tight neon-text" data-aos="fade-up">
                    Empower Your Mind,<br />Unlock Your <span className="text-white">Potential</span>
                </h1>
                <p className="text-xl mb-12" data-aos="fade-up" data-aos-delay="200">
                    Shape your future with custom-made learning plans.
                </p>
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
