import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const PlanGenerationTest = () => {
  const { session } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const testCases = [
    {
      topic: "Python Programming",
      timeline: "2 weeks"
    },
    {
      topic: "Basic Photography",
      timeline: "3 months"
    },
    {
      topic: "Spanish Language",
      timeline: "1 hour per day for 6 months"
    }
  ];

  const addTestResult = (name, status, details) => {
    setTestResults(prev => [{
      name,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev]);
  };

  const verifyPlanContent = (content) => {
    // Check for required sections
    const requiredSections = [
      '# Learning Plan',
      '## Phase 1: Fundamentals',
      '## Phase 2: Deep Dive',
      '## Phase 3: Application',
      '## Resources',
      '## Timeline'
    ];

    const missingHeaders = requiredSections.filter(section => 
      !content.includes(section)
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required sections: ${missingHeaders.join(', ')}`);
    }

    // Check content length
    if (content.length < 500) {
      throw new Error('Plan content appears too short');
    }

    return true;
  };

  const runTest = async (testCase) => {
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify(testCase),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate plan');
      }

      // Verify plan data
      const plan = data.plan;
      if (!plan.id || !plan.user_id || !plan.content || !plan.created_at) {
        throw new Error('Missing required plan fields');
      }

      // Verify plan content structure
      verifyPlanContent(plan.content);

      addTestResult(
        `Generate Plan: ${testCase.topic}`,
        'SUCCESS',
        `Plan ID: ${plan.id}, Content Length: ${plan.content.length} chars`
      );

      return plan;
    } catch (error) {
      addTestResult(
        `Generate Plan: ${testCase.topic}`,
        'ERROR',
        error.message
      );
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Run tests sequentially to avoid overwhelming the API
      for (const testCase of testCases) {
        await runTest(testCase);
        // Add a delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Plan Generation Tests</h2>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg ${
              result.status === 'SUCCESS' ? 'bg-green-50 border border-green-200' :
              'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium">{result.name}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                result.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.details}</p>
            <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanGenerationTest;