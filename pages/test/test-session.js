import SessionTest from '../../components/SessionTest';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Session Management Tests</h1>
        <SessionTest />
      </div>
    </div>
  );
}
