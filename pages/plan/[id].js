// pages/plan/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { usePlan } from '@/hooks/usePlan';
import LearningChat from '@/components/LearningChat';
import LearningPlanViewer from '@/components/LearningPlanViewer';

export default function PlanPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(384);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const minWidth = 384;
  const maxWidth = 768;

  const { plan, loading, error } = usePlan(id);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
      setChatWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setStartX(0);
      setStartWidth(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, startX, startWidth, minWidth, maxWidth]);

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setStartWidth(chatWidth);
    setIsDragging(true);
  };

  if (loading || !plan) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      {loading ? 'Loading plan...' : 'Error loading plan'}
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>{plan.topic} - Learning Plan</title>
      </Head>

      <div className="flex min-h-screen">
        {/* Chat Side Panel */}
        <div
          className={`fixed left-0 top-0 h-full bg-white shadow-lg ${isChatOpen ? '' : 'w-12'} flex flex-col
            ${isDragging ? '' : 'transition-all duration-300'}`}
          style={{ width: isChatOpen ? `${chatWidth}px` : undefined }}
        >
          {/* Resize Handle - now pointer-events-none except for the handle itself */}
          {isChatOpen && (
            <div className="absolute right-0 top-0 bottom-0 w-2 pointer-events-none">
              <div 
                className="w-full h-full cursor-ew-resize z-50 hover:bg-accent/10 pointer-events-auto"
                onMouseDown={handleMouseDown}
              />
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="absolute -right-4 top-4 bg-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isChatOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isChatOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </button>

          {/* Minimized State Label */}
          {!isChatOpen && (
            <div className="h-full flex items-center justify-center">
              <span
                className="gradient-text-blue whitespace-nowrap transform -rotate-90"
                style={{ transformOrigin: 'center' }}
              >
                Learning Assistant
              </span>
            </div>
          )}

          {/* Chat Component */}
          {isChatOpen && (
            <div className="flex-1 overflow-hidden">
              <LearningChat planId={plan.id} topic={plan.topic} />
            </div>
          )}
        </div>

        {/* Main Content */}
        <main 
          className={`flex-1 ${isDragging ? '' : 'transition-all duration-300'}`}
          style={{ marginLeft: isChatOpen ? `${chatWidth}px` : '3rem' }}
        >
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-surface p-8 rounded-lg shadow-claude">
                <div className="flex flex-col gap-2 mb-8">
                  <h1 className="text-primary text-3xl font-semibold">{plan.topic}</h1>
                  <span className="text-gray-400 text-sm">
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <LearningPlanViewer
                  initialContent={plan.json_content || plan.content}
                  planId={plan.id}
                  contentType={plan.json_content ? 'json' : 'markdown'}
                />

                <div className="mt-8 pt-8 border-t border-claude-border">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Progress</span>
                    <span className="text-primary font-medium">{plan.progress}%</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-accent h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}