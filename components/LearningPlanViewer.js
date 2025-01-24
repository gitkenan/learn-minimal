import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import TaskNotes from './TaskNotes';
import { useAuth } from '@/context/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { useWorkflow } from '@/context/WorkflowContext';
import { useExamFromPlan } from '@/hooks/useExamFromPlan';
import LearningChat from './LearningChat';
import ActionMenu from './ActionMenu';
import { initializeSupabase } from '@/lib/supabaseClient';

import { 
  detectSectionType,
  calculateProgress,
  baseMarkdownParser
} from '@/utils/planParserUtils';

// Helper function to validate JSON structure
function isValidPlanStructure(content) {
  return content?.sections?.length > 0 && 
         content.sections.every(section => 
           section.id && section.title && Array.isArray(section.items));
}

// Function to process text content and handle markdown formatting
const processContent = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Handle bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Handle italics
    .replace(/`(.*?)`/g, '<code>$1</code>')           // Handle inline code
    .replace(/\[([\sx])\]/g, '')                     // Replace checkboxes with a nice symbol
    .trim();
};

// Parser function that converts markdown to structured data
export function parseMarkdownPlan(markdown) {
  const lines = markdown.split('\n');
  
  // Get title from first h1 heading
  const title = lines[0]?.startsWith('# ') 
    ? lines[0].substring(2).trim()
    : 'Learning Plan';
  
  // Skip the first h1 heading as it will be used as the title
  const filteredLines = lines[0]?.startsWith('# ') 
    ? lines.slice(1) 
    : lines;

  const sections = baseMarkdownParser(filteredLines.join('\n'), processContent);
  const progress = calculateProgress(sections);

  return {
    topic: title,
    sections,
    progress
  };
}

const LearningPlanViewer = ({ 
  initialContent, 
  planId, 
  onProgressUpdate,
  contentType = 'json',
  onChatStart
}) => {
  const { user } = useAuth();
  const { setActivePlanId } = useWorkflow();
  const { startExamFromPlan } = useExamFromPlan();
  const [openChats, setOpenChats] = useState(new Set());
  const [activeNoteItem, setActiveNoteItem] = useState(null);
  
  const { 
    plan,
    notes,
    loading,
    error,
    updating,
    toggleTask,
    saveNote,
    deleteNote
  } = usePlan(planId);
  
  const [parsedContent, setParsedContent] = useState(null);

  // Process initial content
  useEffect(() => {
    let processedContent;
    try {
      if (contentType === 'json') {
        processedContent = typeof initialContent === 'string' 
          ? JSON.parse(initialContent)
          : initialContent;
          
        if (!isValidPlanStructure(processedContent)) {
          console.warn('Invalid JSON structure, falling back to markdown parsing');
          processedContent = parseMarkdownPlan(
            typeof initialContent === 'string' ? initialContent : ''
          );
        }
      } else {
        processedContent = parseMarkdownPlan(initialContent);
      }

      // Ensure topic is set
      if (!processedContent.topic) {
        processedContent.topic = processedContent.sections[0]?.title || 'Learning Plan';
      }

      setParsedContent(processedContent);
    } catch (e) {
      console.warn('Content processing failed:', e);
      const fallbackContent = parseMarkdownPlan(
        typeof initialContent === 'string' ? initialContent : ''
      );
      fallbackContent.topic = fallbackContent.sections[0]?.title || 'Learning Plan';
      setParsedContent(fallbackContent);
    }
  }, [initialContent, contentType]);

  // Set active plan in workflow context
  useEffect(() => {
    if (planId) {
      setActivePlanId(planId);
    }
  }, [planId, setActivePlanId]);

  // Update progress callback
  useEffect(() => {
    if (plan && onProgressUpdate) {
      onProgressUpdate(plan.progress);
    }
  }, [plan, plan?.progress, onProgressUpdate]);

  const handleAddToCalendar = async (date, sectionId = null, itemId = null) => {
    try {
      // Validate required data
      if (!planId || !date) {
        toast.error('Missing required information');
        return;
      }

      // Get content based on context
      let content;
      if (sectionId && itemId) {
        const section = parsedContent.sections.find(s => s.id === sectionId);
        const item = section?.items.find(i => i.id === itemId);
        content = item?.content;
      } else if (sectionId) {
        const section = parsedContent.sections.find(s => s.id === sectionId);
        content = section?.title;
      } else {
        content = parsedContent?.topic;
      }

      if (!content) {
        toast.error('Could not determine task content');
        return;
      }

      const response = await fetch('/api/calendar/add-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: planId,
          section_id: sectionId,
          item_id: itemId,
          content,
          date
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('Add task failed:', responseText);
        const errorData = JSON.parse(responseText);
        const message = errorData.code === '23505'
          ? 'This item already has a task scheduled for this date. Edit the existing task instead.'
          : `Failed to add task: ${response.statusText} - ${errorData.error}`;
        throw new Error(message);
      }

      const data = JSON.parse(responseText);

      toast.success('Successfully added to calendar');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error(error.message || 'Failed to add to calendar');
    }
  };

  const handleTaskInteraction = async (e, sectionId, itemId) => {
    e.preventDefault();
    e.stopPropagation();

    // Store previous state before making updates
    const previousState = {
      sections: [...parsedContent.sections],
      progress: parsedContent.progress
    };

    try {
      // Find and update the item immediately in local state
      const updatedSections = parsedContent.sections.map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, isComplete: !item.isComplete };
          })
        };
      });

      // Update local state immediately
      setParsedContent({
        ...parsedContent,
        sections: updatedSections,
        progress: calculateProgress(updatedSections)
      });

      // Sync with backend using toggleTask which handles both plan and calendar updates
      await toggleTask(sectionId, itemId);
    } catch (error) {
      // Revert on error using stored previous state
      setParsedContent(prev => ({
        ...prev,
        sections: previousState.sections,
        progress: previousState.progress
      }));
      console.error('Failed to toggle task:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleStartChat = (content, sectionId = null, itemId = null) => {
    // If mobile handler is provided, use it
    if (onChatStart) {
      let title = '';
      let context = '';

      if (!sectionId && !itemId) {
        title = 'Full Plan';
        context = `This chat is about the entire learning plan`;
      } else if (sectionId && !itemId) {
        const section = parsedContent.sections.find(s => s.id === sectionId);
        title = section?.title || 'Section';
        context = `This chat is about the section: ${section?.title}`;
      } else if (sectionId && itemId) {
        const section = parsedContent.sections.find(s => s.id === sectionId);
        const item = section?.items.find(i => i.id === itemId);
        title = item?.content || 'Task';
        context = `This chat is about the task: ${item?.content}`;
      }

      onChatStart({ title, context });
      return;
    }

    // Desktop chat handling
    const chatKey = `${sectionId || 'plan'}-${itemId || 'main'}`;
    setOpenChats(prev => {
      const next = new Set(prev);
      if (next.has(chatKey)) {
        next.delete(chatKey);
      } else {
        next.add(chatKey);
      }
      return next;
    });
  };

  const handleSaveNote = async (taskId, content) => {
    try {
      await saveNote(taskId, content);
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  };

  // Loading state
  if (loading) {
    return <div className="animate-pulse">Loading plan...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-end mb-4">
            <ActionMenu 
            onExam={() => startExamFromPlan({ ...parsedContent, topic: plan?.topic || parsedContent?.topic })}
            onChat={() => handleStartChat(parsedContent)}
            onAddToCalendar={(date) => handleAddToCalendar(date)}
            label="entire plan"
            />
        </div>

        {openChats.has('plan-main') && (
          <div className="mb-8 border rounded-lg shadow-sm transition-all duration-200 ease-in-out" data-chat-key="plan-main">
            <div className="relative h-[500px]">
              <button 
                onClick={() => handleStartChat(parsedContent)}
                className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <LearningChat 
                planId={planId}
                topic={parsedContent?.topic || 'Learning Plan'}
                initialContext={`This chat is about the entire learning plan`}
                key="plan-main"
              />
            </div>
          </div>
        )}

        {parsedContent?.sections.map(section => (
        <div key={section.id} className="space-y-4">
          <div className="flex items-center justify-between">
            {section.headingLevel === 2 ? (
              <h2 
                className="text-2xl font-semibold text-gray-900"
                dangerouslySetInnerHTML={{ __html: section.title }}
              />
            ) : (
              <h3 
                className="text-xl font-semibold text-gray-900"
                dangerouslySetInnerHTML={{ __html: section.title }}
              />
            )}
            <ActionMenu 
              onExam={() => startExamFromPlan({ ...parsedContent, topic: plan?.topic || parsedContent?.topic }, section.id)}
              onChat={() => handleStartChat(parsedContent, section.id)}
              onAddToCalendar={(date) => handleAddToCalendar(date, section.id)}
              label="this section"
            />
          </div>

          {openChats.has(`${section.id}-main`) && (
            <div className="mb-8 border rounded-lg shadow-sm transition-all duration-200 ease-in-out" data-chat-key={`${section.id}-main`}>
              <div className="relative h-[500px]">
                <button 
                  onClick={() => handleStartChat(parsedContent, section.id)}
                  className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close chat"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <LearningChat 
                  planId={planId}
                  topic={section.title}
                  initialContext={`This chat is about the section: ${section.title}`}
                  key={`${section.id}-main`}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            {section.items.map(item => (
              <div key={item.id} className="group">
                {item.type === 'task' ? (
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3 py-2 px-3 -ml-3 rounded-lg">
                      <button
                        className={`flex-grow text-left flex items-start gap-3
                          transition-colors duration-200
                          ${updating ? 'opacity-50' : 'hover:bg-gray-50/50'}`}
                        onClick={(e) => handleTaskInteraction(e, section.id, item.id)}
                        disabled={updating}
                        role="checkbox"
                        aria-checked={item.isComplete}
                      >
                        <div className={`
                          mt-1 flex-shrink-0 w-4 h-4 border rounded
                          ${item.isComplete ? 'bg-accent border-accent' : 'border-accent-muted'}
                          transition-colors duration-200
                        `}>
                          {item.isComplete && (
                            <svg className="w-3 h-3 text-white m-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                            </svg>
                          )}
                        </div>
                        <span 
                          className={`flex-grow text-gray-900 ${item.isComplete ? 'line-through text-accent-muted' : ''}`}
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </button>
                      <ActionMenu 
                        onExam={() => startExamFromPlan({ ...parsedContent, topic: plan?.topic || parsedContent?.topic }, section.id, item.id)}
                        onChat={() => handleStartChat(parsedContent, section.id, item.id)}
                        onAddNote={() => setActiveNoteItem(item.id)}
                        onAddToCalendar={(date) => handleAddToCalendar(date, section.id, item.id)}
                        label="this task"
                      />
                    </div>

                    {openChats.has(`${section.id}-${item.id}`) && (
                      <div className="mb-8 border rounded-lg shadow-sm transition-all duration-200 ease-in-out" data-chat-key={`${section.id}-${item.id}`}>
                        <div className="relative h-[500px]">
                          <button 
                            onClick={() => handleStartChat(parsedContent, section.id, item.id)}
                            className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100"
                            aria-label="Close chat"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <LearningChat 
                            planId={planId}
                            topic={item.content}
                            initialContext={`This chat is about the task: ${item.content}`}
                            key={`${section.id}-${item.id}`}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div key={item.id} className="mt-2">
                      <TaskNotes
                        taskId={item.id}
                        notes={notes[item.id] || []}
                        onSaveNote={(content) => handleSaveNote(item.id, content)}
                        onDeleteNote={deleteNote}
                        isAddingNote={activeNoteItem === item.id}
                        onCancelAdd={() => setActiveNoteItem(null)}
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    className="text-gray-700 py-1"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LearningPlanViewer;
