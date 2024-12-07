// app/plan/[id]/page.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { storage } from '../../../lib/storage';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ThumbUpIcon, ThumbDownIcon } from '@heroicons/react/solid';

export default function PlanDetail() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandData, setExpandData] = useState({});
  const [expandLoading, setExpandLoading] = useState({});
  const [feedbackMode, setFeedbackMode] = useState({});
  const [feedbackText, setFeedbackText] = useState({});

  // ... (previous useEffect and fetchPlan logic remains the same)

  const handleExpand = async (index, content) => {
    if (expandData[index]) {
      setExpandedSections(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
      return;
    }

    setExpandLoading(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: content })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to expand content');
      }

      setExpandData(prev => ({ ...prev, [index]: data.expanded }));
      setExpandedSections(prev => ({ ...prev, [index]: true }));
    } catch (error) {
      console.error('Error expanding content:', error);
      alert('Failed to expand content. Please try again.');
    } finally {
      setExpandLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleThumbsUp = (index) => {
    // Simple acknowledgment for now
    alert('Thanks for the positive feedback!');
  };

  const handleThumbsDown = (index) => {
    setFeedbackMode(prev => ({ ...prev, [index]: true }));
  };

  const handleFeedbackSubmit = async (index, content) => {
    if (!feedbackText[index]?.trim()) {
      alert('Please provide some feedback text');
      return;
    }

    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippet: content,
          feedback: feedbackText[index]
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process feedback');
      }

      // Update the expanded content with the improvement
      setExpandData(prev => ({ ...prev, [index]: data.improved }));
      setFeedbackMode(prev => ({ ...prev, [index]: false }));
      setFeedbackText(prev => ({ ...prev, [index]: '' }));

      alert('Thank you! The content has been improved based on your feedback.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to process feedback. Please try again.');
    }
  };

  // ... (loading and error states remain the same)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{plan.topic}</h1>
          <div className="space-y-6">
            {plan.content.split('\n')
              .filter(line => line.trim())
              .map((step, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  {/* Main Content Section */}
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div 
                        className="prose prose-invert max-w-none flex-grow"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(marked(step))
                        }}
                      />
                      <button
                        onClick={() => handleExpand(index, step)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200 text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                        disabled={expandLoading[index]}
                      >
                        {expandLoading[index] ? (
                          <>
                            <LoadingSpinner />
                            <span>Loading...</span>
                          </>
                        ) : (
                          'Learn More'
                        )}
                      </button>
                    </div>

                    {/* Expanded Content Section */}
                    {expandedSections[index] && expandData[index] && (
                      <div className="mt-6">
                        <div className="p-6 bg-gray-700/50 rounded-lg border-l-4 border-blue-500">
                          <div
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(marked(expandData[index]))
                            }}
                          />
                          
                          {/* Feedback Section */}
                          <div className="mt-4 flex items-center gap-4 pt-4 border-t border-gray-600">
                            <button
                              onClick={() => handleThumbsUp(index)}
                              className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                            >
                              <ThumbUpIcon className="w-5 h-5" />
                              <span>Helpful</span>
                            </button>
                            <button
                              onClick={() => handleThumbsDown(index)}
                              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                            >
                              <ThumbDownIcon className="w-5 h-5" />
                              <span>Need Improvement</span>
                            </button>
                          </div>

                          {/* Feedback Input Form */}
                          {feedbackMode[index] && (
                            <div className="mt-4 space-y-4">
                              <textarea
                                value={feedbackText[index] || ''}
                                onChange={(e) => setFeedbackText(prev => ({
                                  ...prev,
                                  [index]: e.target.value
                                }))}
                                placeholder="How can we improve this explanation?"
                                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleFeedbackSubmit(index, expandData[index])}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                                >
                                  Submit Feedback
                                </button>
                                <button
                                  onClick={() => setFeedbackMode(prev => ({ ...prev, [index]: false }))}
                                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}