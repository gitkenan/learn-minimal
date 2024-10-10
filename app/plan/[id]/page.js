// app/plan/[id]/page.js

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { marked } from 'marked';

export default function PlanDetail() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    } else if (isLoaded && userId) {
      fetch(`/api/plans/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.plan) {
            setPlan(data.plan);
            setProgress(data.plan.progress || {});
          } else {
            alert('Plan not found.');
            router.push('/dashboard');
          }
        })
        .catch((err) => {
          console.error('Error fetching plan:', err);
          alert('An error occurred while fetching the plan.');
          router.push('/dashboard');
        });
    }
  }, [isLoaded, userId, id]);

  const handleCheckboxChange = (index) => {
    const newProgress = { ...progress, [index]: !progress[index] };
    setProgress(newProgress);

    // Save progress to the server
    fetch(`/api/plans/${id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: newProgress }),
    }).catch((err) => {
      console.error('Error updating progress:', err);
      alert('Failed to update progress.');
    });
  };

  if (!plan) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  // Split content into lines and determine which lines should have checkboxes
  const planLines = plan.content.split('\n');
  const planSteps = planLines.map((line, index) => {
    const trimmedLine = line.trim();
    const hasCheckbox = trimmedLine.startsWith('* ') || trimmedLine.startsWith('+');
    const formattedLine = marked(trimmedLine.replace(/^[*+]\s*/, ''));

    return {
      index,
      text: formattedLine,
      hasCheckbox,
      isCompleted: progress[index] || false,
    };
  });

  // Calculate completion percentage
  const stepsWithCheckboxes = planSteps.filter((step) => step.hasCheckbox);
  const completedSteps = stepsWithCheckboxes.filter((step) => step.isCompleted).length;
  const totalStepsWithCheckboxes = stepsWithCheckboxes.length;
  const completionPercentage = totalStepsWithCheckboxes === 0 ? 0 : Math.round((completedSteps / totalStepsWithCheckboxes) * 100);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="container mx-auto px-4 py-4 flex justify-between">
        <h1 className="text-2xl font-bold">{plan.topic}</h1>
        <Link href="/dashboard">
          <button className="text-white">Back to Dashboard</button>
        </Link>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-12 bg-gray-800 p-8 rounded-md">
          <ul className="space-y-4">
            {planSteps.map((step) => (
              <li key={step.index} className="flex items-start">
                {step.hasCheckbox && (
                  <input
                    type="checkbox"
                    checked={step.isCompleted}
                    onChange={() => handleCheckboxChange(step.index)}
                    className="mt-1 mr-3 h-5 w-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                  />
                )}
                <span
                  className="text-lg flex-1"
                  dangerouslySetInnerHTML={{ __html: step.text }}
                ></span>
                {step.isCompleted && step.hasCheckbox && (
                  <CheckIcon className="h-5 w-5 text-green-500 ml-2" />
                )}
              </li>
            ))}
          </ul>

          {/* Progress bar and completion percentage */}
          <div className="w-full bg-gray-700 rounded-full h-2 mt-6">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-400">{`Progress: ${completionPercentage}%`}</p>
        </div>
      </main>
    </div>
  );
}
