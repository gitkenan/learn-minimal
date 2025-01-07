// pages/plan/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { usePlan } from '@/hooks/usePlan';
import LearningChat from '@/components/LearningChat';
import LearningPlanViewer from '@/components/LearningPlanViewer';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function PlanPage() {
  const router = useRouter();
  const { id } = router.query;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(384);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const minWidth = isMobile ? window.innerWidth * 0.8 : 384;
  const maxWidth = isMobile ? window.innerWidth * 0.95 : 768;

  const { plan, loading, error } = usePlan(id);

  useEffect(() => {
    // Reset chat width when switching between mobile and desktop
    setChatWidth(isMobile ? window.innerWidth * 0.8 : 384);
  }, [isMobile]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
      setChatWidth(newWidth);
    };

    const onTouchMove = (e) => {
      if (!isDragging || !e.touches[0]) return;
      const delta = e.touches[0].clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
      setChatWidth(newWidth);
    };

    const onEnd = () => {
      setIsDragging(false);
      setStartX(0);
      setStartWidth(0);
    };

    if (isDragging) {
      if (isMobile) {
        document.addEventListener('touchmove', onTouchMove);
        document.addEventListener('touchend', onEnd);
      } else {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onEnd);
      }
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, startX, startWidth, minWidth, maxWidth, isMobile]);

  const handleStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
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
        {/* Desktop Chat Side Panel */}
        {!isMobile && (
          <div
            className={`fixed left-0 top-0 h-full bg-white shadow-lg ${isChatOpen ? '' : 'w-12'} flex flex-col
              ${isDragging ? '' : 'transition-all duration-300'}`}
            style={{ 
              width: isChatOpen ? `${chatWidth}px` : undefined,
            }}
          >
            {/* Desktop Resize Handle */}
            {isChatOpen && (
              <div className="absolute right-0 top-16 bottom-0 w-2 pointer-events-none">
                <div 
                  className="w-full h-full cursor-ew-resize z-50 hover:bg-accent/10 pointer-events-auto"
                  onMouseDown={handleStart}
                />
              </div>
            )}

            {/* Desktop Toggle Button */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="absolute -right-5 top-4 bg-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10"
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

            {/* Desktop Minimized State */}
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

            {/* Desktop Chat Component */}
            {isChatOpen && (
              <div className="flex-1 overflow-hidden bg-white">
                <LearningChat planId={plan.id} topic={plan.topic} />
              </div>
            )}
          </div>
        )}

        {/* Mobile Bottom Drawer */}
        {isMobile && (
          <div
            className={`fixed left-0 right-0 bottom-0 bg-white shadow-lg-up transition-transform duration-300 z-50
              ${isChatOpen ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ 
              height: '80vh',
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Mobile Header */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gray-100 flex items-center justify-between px-4 border-b border-gray-200">
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="font-medium text-gray-700">Learning Assistant</div>
              <div className="w-9" /> {/* Spacer for balance */}
            </div>

            {/* Mobile Chat Component */}
            <div className="h-full pt-12 overflow-hidden bg-white">
              <LearningChat planId={plan.id} topic={plan.topic} />
            </div>
          </div>
        )}

        {/* Mobile Toggle Button */}
        {isMobile && !isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed right-4 bottom-4 bg-primary text-white p-4 rounded-full shadow-lg z-50 hover:bg-primary/90 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        )}

        {/* Main Content */}
        <main 
          className={`flex-1 ${isDragging ? '' : 'transition-all duration-300'}`}
          style={{ 
            marginLeft: isChatOpen && !isMobile ? `${chatWidth}px` : isMobile ? 0 : '3rem',
            marginBottom: isMobile && isChatOpen ? '80vh' : 0
          }}
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