import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';

const PlanTest = () => {
  const { user, loading, refreshSession } = useAuth();
  const [planId, setPlanId] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = initializeSupabase();

  const addResult = (name, status, message) => {
    setTestResults(prev => [{
      name,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev]);
  };

  const createTestPlan = async () => {
    try {
      setIsLoading(true);
      
      // Create a test plan
      const { data: plan, error } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          topic: 'Test Learning Plan',
          content: '# Test Content\n\nThis is a test learning plan.',
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      setPlanId(plan.id);
      addResult('Create Plan', 'SUCCESS', `Created plan with ID: ${plan.id}`);
      
      return plan.id;
    } catch (error) {
      addResult('Create Plan', 'ERROR', error.message);
      throw error;
    }
  };

  const fetchPlan = async (id) => {
    try {
      const { data: plan, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return plan;
    } catch (error) {
      throw error;
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Create and fetch a valid plan
      const newPlanId = await createTestPlan();
      
      const plan = await fetchPlan(newPlanId);
      addResult(
        'Fetch Valid Plan', 
        'SUCCESS',
        `Successfully fetched plan with topic: ${plan.topic}`
      );

      // Test 2: Try to fetch a non-existent plan
      try {
        await fetchPlan('non-existent-id');
        addResult('Fetch Invalid Plan', 'FAIL', 'Should have thrown an error');
      } catch (error) {
        addResult(
          'Fetch Invalid Plan', 
          'SUCCESS', 
          'Correctly failed to fetch non-existent plan'
        );
      }

      // Test 3: Create a plan with missing data
      try {
        const { error } = await supabase
          .from('plans')
          .insert({
            // Missing required fields
            topic: 'Incomplete Plan'
          })
          .single();

        if (error) throw error;
        
        addResult('Create Invalid Plan', 'FAIL', 'Should have failed validation');
      } catch (error) {
        addResult(
          'Create Invalid Plan', 
          'SUCCESS', 
          'Correctly failed to create invalid plan'
        );
      }

    } catch (error) {
      addResult('Test Suite', 'ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Plan Testing Suite</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Latest Test Plan ID:</strong> {planId || 'None'}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runTests}
          disabled={isLoading || !user}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </button>

        {planId && (
          <a
            href={`/plan/${planId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            View Test Plan
          </a>
        )}
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg ${
              result.status === 'SUCCESS' ? 'bg-green-50 border border-green-200' :
              result.status === 'FAIL' ? 'bg-red-50 border border-red-200' :
              'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium">{result.name}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                result.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.message}</p>
            <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanTest;
