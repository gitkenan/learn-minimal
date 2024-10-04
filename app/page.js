"use client";

import { useState } from 'react';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [plan, setPlan] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      console.error('Error generating plan');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-lg font-light mb-8 text-gray-600">
        What would you like to learn about today?
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          type="text"
          placeholder="Enter a topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border border-gray-300 rounded-full p-2 w-96 mb-4 text-center"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded-full"
        >
          Get Learning Plan
        </button>
      </form>

      {plan && (
        <div className="mt-8 w-96 bg-gray-100 p-4 rounded-md text-black max-h-96 overflow-y-scroll">
          <h2 className="text-lg font-bold mb-2">Your Learning Plan:</h2>
          <p className="text-gray-900" dangerouslySetInnerHTML={{ __html: plan }}></p>
        </div>
      )}
    </div>
  );
}

