// app/plan/[id]/page.js

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function PlanDetail() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedData, setExpandedData] = useState({});
  const [feedbackMode, setFeedbackMode] = useState({});
  const [feedbackText, setFeedbackText] = useState({});

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

  const handleExpand = async (index, text) => {
    // If already expanded, toggle it off
    if (expandedSections[index]) {
      setExpandedSections({ ...expandedSections, [index]: false });
      return;
    }

    // If we already have expanded data, just toggle it on
    if (expandedData[index]) {
      setExpandedSections({ ...expandedSections, [index]: true });
      return;
    }

    // Otherwise, fetch from API
    try {
      const res = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: text })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Error fetching expanded data:', data.error);
        alert(data.error || 'Failed to expand the section.');
        return;
      }
      setExpandedData({ ...expandedData, [index]: data.expanded });
      setExpandedSections({ ...expandedSections, [index]: true });
    } catch (error) {
      console.error('Error during expansion fetch:', error);
      alert('An error occurred while expanding this section.');
    }
  };

  const handleThumbsUp = (index) => {
    alert('Thanks for your feedback!');
  };

  const handleThumbsDown = (index) => {
    setFeedbackMode({ ...feedbackMode, [index]: true });
  };

  const handleFeedbackSubmit = async (index) => {
    const originalText = planSteps[index].originalText;
    const userFeedback = feedbackText[index] || '';

    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: originalText, feedback: userFeedback })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Error improving section:', data.error);
        alert(data.error || 'Failed to improve the section.');
        return;
      }
      setExpandedData({ ...expandedData, [index]: data.improved });
      setFeedbackMode({ ...feedbackMode, [index]: false });
      alert('Thanks! Updated the section based on your feedback.');
    } catch (error) {
      console.error('Error during improvement fetch:', error);
      alert('An error occurred while improving this section.');
    }
  };

  if (!plan) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  // Split content into lines and determine which lines should have checkboxes
  const planLines = plan.content.split('\n');
  const planSteps = planLines.map((line, index) => {
    const trimmedLine = line.trim();
    const hasCheckbox = trimmedLine.startsWith('* ') || trimmedLine.startsWith('+');
    const formattedLine = DOMPurify.sanitize(
        marked(trimmedLine.replace(/^[*+]\s*/, ''))
      );
      
    return {
      index,
      text: formattedLine,
      originalText: trimmedLine,
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
                <div className="mt-2 flex items-center space-x-4">
                  <button
                    onClick={() => handleExpand(step.index, step.originalText)}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {expandedSections[step.index] ? 'Hide details' : 'Learn more'}
                  </button>
                  {expandedSections[step.index] && expandedData[step.index] && (
                    <div className="mt-2 bg-gray-700 p-4 rounded-md w-full">
                      <div
                        className="prose prose-invert"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(expandedData[step.index])) }}
                      ></div>
                      <div className="mt-4 flex space-x-4">
                        <button
                          className="text-sm text-green-500 hover:underline"
                          onClick={() => handleThumbsUp(step.index)}
                        >
                          👍 Thumbs Up
                        </button>
                        <button
                          className="text-sm text-red-500 hover:underline"
                          onClick={() => handleThumbsDown(step.index)}
                        >
                          👎 Thumbs Down
                        </button>
                      </div>
                      {feedbackMode[step.index] && (
                        <div className="mt-4">
                          <textarea
                            className="w-full p-2 rounded-md bg-gray-800 text-gray-200"
                            placeholder="What would you have preferred for this section?"
                            value={feedbackText[step.index] || ''}
                            onChange={(e) =>
                              setFeedbackText({ ...feedbackText, [step.index]: e.target.value })
                            }
                          ></textarea>
                          <button
                            onClick={() => handleFeedbackSubmit(step.index)}
                            className="mt-2 px-4 py-2 bg-green-600 rounded text-white hover:bg-green-500"
                          >
                            Submit Improvement
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
