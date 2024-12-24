import PlanTest from '@/components/PlanTest';

export default function TestPlanPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Plan Integration Tests</h1>
        <PlanTest />
      </div>
    </div>
  );
}
