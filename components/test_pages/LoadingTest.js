import { useState, useEffect } from 'react';
import { Loading } from '../ui/loading';

export default function LoadingTest() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Loading Component Showcase</h1>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Spinner Variants</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <Loading size="sm" message="Small spinner" />
          </div>
          <div className="p-4 border rounded">
            <Loading message="Default spinner" />
          </div>
          <div className="p-4 border rounded">
            <Loading size="lg" message="Large spinner" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skeleton Loading</h2>
        <div className="p-4 border rounded">
          <Loading 
            variant="skeleton" 
            lines={3} 
            message="Loading content..." 
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Progress Indicators</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <Loading 
              variant="shimmer" 
              progress={progress}
              message="Loading progress..." 
            />
          </div>
          <div className="p-4 border rounded">
            <Loading 
              variant="progress" 
              progress={progress}
              message={`Loading: ${progress}%`} 
            />
          </div>
        </div>
      </section>
    </div>
  );
}