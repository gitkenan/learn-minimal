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
  const [loadingExpansions, setLoadingExpansions] = useState({});
  const [requestedBefore, setRequestedBefore] = useState({});
  const [feedbackMode, setFeedbackMode] = useState({});
  const [feedbackText, setFeedbackText] = useState({});

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans/${id}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch plan');
        }

        if (!data.plan) {
          throw new Error('Plan not found');
        }

        setPlan(data.plan);
        // Initialize progress from the plan data if it exists
        setProgress(data.plan.progress || {});
      } catch (error) {
        console.error('Error fetching plan:', error);
      }
    };

    if (id) {
      fetchPlan();
    }
  }, [id]);

  const handleCheckboxChange = async (stepIndex) => {
    try {
      // Update local state optimistically
      const newProgress = {
        ...progress,
        [stepIndex]: !progress[stepIndex]
      };
      setProgress(newProgress);

      // Send update to server
      const res = await fetch(`/api/plans/${id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress: newProgress })
      });

      if (!res.ok) {
        // Revert on error
        setProgress(progress);
        throw new Error('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleExpand = async (stepIndex, originalText) => {
    if (loadingExpansions[stepIndex] || expandedData[stepIndex]) {
      // Toggle visibility if already expanded
      setExpandedSections(prev => ({
        ...prev,
        [stepIndex]: !prev[stepIndex]
      }));
      return;
    }

    setLoadingExpansions(prev => ({
      ...prev,
      [stepIndex]: true
    }));

    try {
      const res = await fetch('/api/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ snippet: originalText })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to expand content');
      }

      setExpandedData(prev => ({
        ...prev,
        [stepIndex]: data.expanded
      }));
      setExpandedSections(prev => ({
        ...prev,
        [stepIndex]: true
      }));
      setRequestedBefore(prev => ({
        ...prev,
        [stepIndex]: true
      }));
    } catch (error) {
      console.error('Error expanding content:', error);
    } finally {
      setLoadingExpansions(prev => ({
        ...prev,
        [stepIndex]: false
      }));
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

  // Process the plan content to extract steps
  const planSteps = plan.content.split('\n')
    .filter(line => line.trim())
    .map((line, index) => {
      const cleanLine = line.trim();
      const listMarker = cleanLine.match(/^[-*+]\s*/)?.[0] || '';
      const textContent = cleanLine.replace(/^[-*+]\s*/, '');
      
      return {
        index,
        text: textContent,
        originalText: cleanLine,
        hasCheckbox: !!listMarker,
        isCompleted: progress[index] || false,
        hasLearnMore: true // Make all rows hoverable and expandable
      };
    });

  // Calculate completion percentage
  const stepsWithCheckbox = planSteps.filter(step => step.hasCheckbox);
  const totalStepsWithCheckboxes = stepsWithCheckbox.length;
  const completedSteps = Object.values(progress).filter(Boolean).length;
  const completionPercentage = totalStepsWithCheckboxes === 0 ? 0 : Math.round((completedSteps / totalStepsWithCheckboxes) * 100);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{plan.topic}</h1>
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <ul className="space-y-2">
            {planSteps.map((step) => (
              <li
                key={step.index}
                className="group rounded-md hover:bg-gray-800/50 transition-colors duration-200"
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
                      <div className="flex-grow prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(step.text) }} />
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
    </div>
  );
}
