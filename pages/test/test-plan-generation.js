// pages/test/test-plan-generation.js
import PlanGenerationTest from '../../components/PlanGenerationTest';

export default function TestPlanGeneration() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Plan Generation Tests</h1>
        <PlanGenerationTest />
      </div>
    </div>
  );
}