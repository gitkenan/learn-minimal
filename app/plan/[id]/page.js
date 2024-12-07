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
  // Loading state for expansions
  const [loadingExpansions, setLoadingExpansions] = useState({});

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
      setLoadingExpansions({ ...loadingExpansions, [index]: true });
      console.log('Expanding text:', text);
      const res = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: text }),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      let data;
      try {
        const rawText = await res.text();
        console.log('Raw response text:', rawText);
        
        try {
          data = JSON.parse(rawText);
          console.log('Parsed response data:', data);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Failed to parse text:', rawText);
          throw new Error('Failed to parse server response');
        }
      } catch (error) {
        console.error('Error reading response:', error);
        throw new Error('Failed to read server response');
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
      alert(error.message);
    } finally {
      setLoadingExpansions({ ...loadingExpansions, [index]: false });
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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
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
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{plan.topic}</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <ul className="space-y-4">
            {planSteps.map((step) => (
              <li
                key={step.index}
                className={`rounded-md ${
                  step.includes('Learn more') ? 'hover:bg-gray-700/50 transition-colors duration-200 group' : ''
                }`}
              >
                <div className="flex items-start p-2">
                  {step.hasCheckbox && (
                    <input
                      type="checkbox"
                      checked={!!progress[step.index]}
                      onChange={() => handleCheckboxChange(step.index)}
                      className="mt-1 mr-2"
                    />
                  )}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">{step.text}</div>
                      {step.includes('Learn more') && (
                        <button
                          onClick={() => handleExpand(step.index, step.originalText)}
                          disabled={loadingExpansions[step.index]}
                          className="ml-4 px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                        >
                          {loadingExpansions[step.index] ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Expanding...
                            </span>
                          ) : (
                            'Learn more'
                          )}
                        </button>
                      )}
                    </div>
                    {expandedSections[step.index] && expandedData[step.index] && (
                      <div className="mt-3 ml-4 p-4 bg-gray-700/50 rounded-md">
                        <div
                          className="prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(expandedData[step.index])) }}
                        />
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 mt-6">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-400">{`Progress: ${completionPercentage}%`}</p>
    </div>
  );
}
