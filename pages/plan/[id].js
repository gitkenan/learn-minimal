// pages/plan/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { usePlan } from '@/hooks/usePlan';
import LearningChat from '@/components/LearningChat';
import LearningPlanViewer from '@/components/LearningPlanViewer';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function PlanPage() {
  const router = useRouter();
  const { id } = router.query;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeMobileChat, setActiveMobileChat] = useState(null);
  const { plan, loading, error } = usePlan(id);

  // Handle mobile chat activation
  const handleMobileChat = (context) => {
    setActiveMobileChat(context);
  };


  if (loading || !plan) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      {loading ? 'Loading plan...' : 'Error loading plan'}
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      
        <div className="flex min-h-screen pt-20">
        <main className="flex-1">

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-surface p-8 rounded-lg shadow-claude">
                <div className="flex flex-col gap-2 mb-8">
                  <h1 className="text-primary text-3xl font-semibold">{plan.title || plan.topic}</h1>
                  <span className="text-gray-400 text-sm">
                    Created {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <LearningPlanViewer
                  initialContent={plan.json_content || plan.content}
                  planId={plan.id}
                    contentType={plan.json_content ? 'json' : 'markdown'}
                    onChatStart={isMobile ? handleMobileChat : undefined}
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

        {/* Mobile Chat Overlay */}
        {isMobile && activeMobileChat && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h3 className="font-medium text-lg truncate flex-1 mr-4">
            {activeMobileChat.title}
            </h3>
            <button
            onClick={() => setActiveMobileChat(null)}
            className="p-2 hover:bg-gray-100 rounded-full"
            >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LearningChat
            planId={plan.id}
            topic={activeMobileChat.title}
            initialContext={activeMobileChat.context}
            />
          </div>
          </div>
        </div>
        )}
      </div>
      );
    }
