import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const EnhancedSessionTest = () => {
  const { user, session, loading, refreshSession } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (name, result, details) => {
    setTestResults(prev => [...prev, { name, result, details, timestamp: new Date() }]);
  };

  const testProtectedAccess = async () => {
    console.log('Test - Session state:', {
      hasToken: !!session?.access_token,
      tokenPreview: session?.access_token?.substring(0, 20) + '...',
      userId: user?.id
    });

    try {
      const response = await fetch('/api/auth-test', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'  // Important! This tells fetch to send cookies
      });
      
      console.log('Test - API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      const data = await response.json();
      console.log('Test - Response data:', data);
      
      addTestResult(
        'Protected API Access',
        response.ok ? 'PASS' : 'FAIL',
        `Status: ${response.status}, ${response.ok ? `Authenticated as ${data.userId}` : `Failed: ${data.error}`}`
      );
    } catch (error) {
      console.error('Test - Fetch error:', error);
      addTestResult('Protected API Access', 'ERROR', error.message);
    }
  };

  const testPlanGeneration = async () => {
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ topic: 'JavaScript Testing' })
      });
      
      console.log('Plan Generation - Response status:', response.status);
      const data = await response.json();
      console.log('Plan Generation - Response data:', data);
      
      addTestResult(
        'Plan Generation',
        response.ok ? 'PASS' : 'FAIL',
        `Status: ${response.status}, ${response.ok ? 
          `Plan ID: ${data.plan.id}` : 
          `Error: ${data.error}`}`
      );
    } catch (error) {
      console.error('Plan Generation - Error:', error);
      addTestResult('Plan Generation', 'ERROR', error.message);
    }
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    // Test 1: Check if session exists
    try {
      addTestResult(
        'Session Existence',
        session ? 'PASS' : 'FAIL',
        `Session Token: ${session?.access_token ? 'Present' : 'Missing'}, User ID: ${user?.id || 'None'}`
      );
    } catch (error) {
      addTestResult('Session Existence', 'ERROR', error.message);
    }

    // Test 2: Test session refresh
    try {
      const newSession = await refreshSession();
      addTestResult(
        'Session Refresh',
        newSession ? 'PASS' : 'FAIL',
        `New Session Token: ${newSession?.access_token ? 'Present' : 'Missing'}`
      );
    } catch (error) {
      addTestResult('Session Refresh', 'ERROR', error.message);
    }

    // Test 3: Test protected API access
    await testProtectedAccess();

    setIsRunningTests(false);
  };

  if (loading) {
    return <div className="p-4">Loading auth state...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Current Auth State</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
          <p><strong>Session Valid:</strong> {session ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="flex mb-6">
        <button
          onClick={runTests}
          disabled={isRunningTests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunningTests ? 'Running Tests...' : 'Run Tests'}
        </button>

        <button
          onClick={testPlanGeneration}
          disabled={isRunningTests || !session}
          className="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Plan Generation
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((test, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${
              test.result === 'PASS' ? 'bg-green-50 border-green-200' :
              test.result === 'FAIL' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium">{test.name}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                test.result === 'PASS' ? 'bg-green-100 text-green-800' :
                test.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {test.result}
              </span>
            </div>
            <p className="text-sm text-gray-600">{test.details}</p>
            <p className="text-xs text-gray-500 mt-1">
              {test.timestamp.toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedSessionTest;
