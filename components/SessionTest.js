import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SessionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const runTests = async () => {
      const results = [];
      
      // Test 1: Try accessing protected page route
      try {
        const response = await fetch('/dashboard');
        results.push({
          name: 'Protected Page Access',
          result: response.redirected ? 'PASS' : 'FAIL',
          details: `Status: ${response.status}, Redirected: ${response.redirected}`
        });
      } catch (error) {
        results.push({
          name: 'Protected Page Access',
          result: 'ERROR',
          details: error.message
        });
      }

      // Test 2: Try API route without auth
      try {
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: 'test' })
        });
        results.push({
          name: 'API Without Auth',
          result: response.status === 401 ? 'PASS' : 'FAIL',
          details: `Status: ${response.status}`
        });
      } catch (error) {
        results.push({
          name: 'API Without Auth',
          result: 'ERROR',
          details: error.message
        });
      }

      setTestResults(results);
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return <div className="p-4">Running tests...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Session Tests Results</h2>
      <div className="space-y-4">
        {testResults.map((test, index) => (
          <div key={index} className="border p-4 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">{test.name}</span>
              <span className={`px-2 py-1 rounded ${
                test.result === 'PASS' ? 'bg-green-100 text-green-800' :
                test.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {test.result}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{test.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionTest;
