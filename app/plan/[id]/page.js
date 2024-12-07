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

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({});
  // State to store the fetched expanded data
  const [expandedData, setExpandedData] = useState({});
  // Whether the user has requested info before (for changing "Learn more" text)
  const [requestedBefore, setRequestedBefore] = useState({});

  // State for thumbs feedback
  const [feedbackMode, setFeedbackMode] = useState({});
  const [feedbackText, setFeedbackText] = useState({});

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
      return; // Early return to prevent further execution
    }

    if (isLoaded && userId) {
      fetch(`/api/plans/${id}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `HTTP error! status: ${res.status}`);
          }
          return data;
        })
        .then((data) => {
          if (data.plan) {
            console.log('Plan data received:', data.plan);
            setPlan(data.plan);
            setProgress(data.plan.progress || {});
          } else {
            console.error('Plan data missing in response');
            alert('Plan not found.');
            router.push('/dashboard');
            return;
          }
        })
        .catch((err) => {
          console.error('Error fetching plan:', err);
          alert(`An error occurred while fetching the plan: ${err.message}`);
          router.push('/dashboard');
          return;
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
    // Toggle off if already expanded
    if (expandedSections[index]) {
      setExpandedSections({ ...expandedSections, [index]: false });
      return;
    }

    // If already have data, just show it
    if (expandedData[index]) {
      setExpandedSections({ ...expandedSections, [index]: true });
      return;
    }

    // Otherwise, fetch from API
    try {
      console.log('Expanding text:', text);
      const res = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: text }),
      });

      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Failed to parse server response');
      }

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      if (!data.expanded) {
        throw new Error('No expanded content in response');
      }

      setExpandedData({ ...expandedData, [index]: data.expanded });
      setExpandedSections({ ...expandedSections, [index]: true });
      setRequestedBefore({ ...requestedBefore, [index]: true });
    } catch (error) {
      console.error('Error during expansion fetch:', error);
      alert(`Failed to expand this section: ${error.message}`);
    }
  };

  const handleThumbsUp = (index) => {
    // For now, do nothing more than alert or console
    console.log('User gave thumbs up on index:', index);
  };

  const handleThumbsDown = (index) => {
    // Show feedback input
    setFeedbackMode({ ...feedbackMode, [index]: true });
  };

  const handleFeedbackSubmit = async (index) => {
    const originalText = planSteps[index].originalText;
    const userFeedback = feedbackText[index] || '';

    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: originalText, feedback: userFeedback }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Error improving section:', data.error);
        alert(data.error || 'Failed to improve the section.');
        return;
      }
      // Update the expandedData with improved text
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

  // Process the plan content
  const planLines = plan.content.split('\n');
  const planSteps = planLines.map((line, index) => {
    const trimmedLine = line.trim();
    const hasCheckbox = trimmedLine.startsWith('* ') || trimmedLine.startsWith('+');
    const cleanedLine = trimmedLine.replace(/^[*+]\s*/, '');
    const formattedLine = DOMPurify.sanitize(marked(cleanedLine));

    return {
      index,
      text: formattedLine,
      originalText: cleanedLine,
      hasCheckbox,
      isCompleted: progress[index] || false
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
          <button className="text-white hover:underline">Back to Dashboard</button>
        </Link>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-12 bg-gray-800 p-8 rounded-md">
          <ul className="space-y-4">
            {planSteps.map((step) => {
              const isExpanded = expandedSections[step.index];
              const hasData = expandedData[step.index];
              const isRequested = requestedBefore[step.index];

              // Determine the button label
              let learnMoreLabel = 'Learn more';
              if (isRequested) {
                learnMoreLabel = isExpanded ? 'Hide details' : 'View details';
              } else if (isExpanded) {
                learnMoreLabel = 'Hide details';
              }

              return (
                <li
                  key={step.index}
                  className="group transition-colors duration-200 rounded-md relative"
                >
                  <div className="flex items-start p-2 hover:bg-gray-700">
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

                    {/* "Learn More" / "View Details" trigger */}
                    <button
                      onClick={() => handleExpand(step.index, step.originalText)}
                      className={`
                        ml-4 text-sm underline
                        ${isExpanded ? 'text-blue-300' : 'text-blue-500'}
                        hover:text-blue-300
                        transition-colors
                        duration-200
                        ${
                          // Desktop: show only on hover unless expanded or requested before
                          // Mobile: always show
                          isExpanded || isRequested
                            ? ''
                            : 'hidden group-hover:inline-block'
                        }
                        
                        @media (max-width: 640px) {
                          inline-block !important;
                        }
                      `}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {learnMoreLabel} {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>

                  {/* Expanded details (below the line) */}
                  {isExpanded && hasData && (
                    <div className="ml-8 mt-2 bg-gray-700 p-4 rounded-md">
                      <div
                        className="prose prose-invert max-w-none"
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
                </li>
              );
            })}
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
