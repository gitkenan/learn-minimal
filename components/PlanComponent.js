// components/PlanComponent.js
import { useState } from 'react';

export default function PlanComponent({ plan, fetchSavedPlans }) {
  const [progress, setProgress] = useState(plan.progress);

  const handleCheckboxChange = async (index) => {
    const newProgress = { ...progress, [index]: !progress[index] };
    setProgress(newProgress);

    await fetch('/api/plans/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id, progress: newProgress }),
    });

    fetchSavedPlans(); // Refresh plans
  };

  const steps = plan.planContent.split('\n').filter((line) => line.trim() !== '');

  const completedSteps = Object.values(progress).filter(Boolean).length;
  const totalSteps = steps.length;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={progress[index] || false}
            onChange={() => handleCheckboxChange(index)}
            className="mr-2"
          />
          <span>{step}</span>
        </div>
      ))}
      <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm">{`Progress: ${completionPercentage}%`}</p>
    </div>
  );
}

