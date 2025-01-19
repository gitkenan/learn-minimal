import { useState, useEffect } from 'react';
import TaskNotes from './TaskNotes';
import { usePlan } from '@/hooks/usePlan';
import { useWorkflow } from '@/context/WorkflowContext';
import { useExamFromPlan } from '@/hooks/useExamFromPlan';
import { usePlanChat } from '@/hooks/usePlanChat';

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
  
  // Skip the first h1 heading as it will be used as the title
  const filteredLines = lines[0]?.startsWith('# ') 
    ? lines.slice(1) 
    : lines;

  const sections = baseMarkdownParser(filteredLines.join('\n'), processContent);
  const progress = calculateProgress(sections);

  return {
    sections,
    progress
  };
}

const LearningPlanViewer = ({ 
  initialContent, 
  planId, 
  onProgressUpdate,
  contentType = 'json'
}) => {
  const { setActivePlanId } = useWorkflow();
  const { startExamFromPlan } = useExamFromPlan();
  const { startChatFromPlan } = usePlanChat();
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

      setParsedContent(processedContent);
    } catch (e) {
      console.warn('Content processing failed:', e);
      const fallbackContent = parseMarkdownPlan(
        typeof initialContent === 'string' ? initialContent : ''
      );
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
  }, [plan?.progress, onProgressUpdate]);

  // Loading state
  if (loading) {
    return <div className="animate-pulse">Loading plan...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const handleTaskInteraction = async (e, sectionId, itemId) => {
    e.preventDefault();
    e.stopPropagation();

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

    // Then sync with backend
    try {
      await toggleTask(sectionId, itemId);
    } catch (error) {
      // Revert on error
      setParsedContent({
        ...parsedContent,
        sections: parsedContent.sections
      });
      console.error('Failed to toggle task:', error);
    }
  };

  const handleSaveNote = async (taskId, content) => {
    try {
      await saveNote(taskId, content);
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
        <div className="flex justify-end gap-4 mb-4">
        <button
          onClick={() => startChatFromPlan(parsedContent)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors duration-200"
        >
          Start Chat About Plan
        </button>
        <button
          onClick={() => startExamFromPlan(parsedContent)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors duration-200"
        >
          Start Exam Based on Plan
        </button>
        </div>
        {parsedContent?.sections.map(section => (
        <div key={section.id} className="space-y-4">
          <div className="flex items-center justify-between">
          <div>
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
          </div>
          <button
            onClick={() => startExamFromPlan(parsedContent, section.id)}
            className="text-sm px-3 py-1 bg-accent/10 hover:bg-accent/20 text-accent rounded transition-colors duration-200"
          >
            Test This Section
          </button>
          </div>

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
                <button
                onClick={() => startExamFromPlan(parsedContent, section.id, item.id)}
                className="text-sm px-3 py-1 bg-accent/10 hover:bg-accent/20 text-accent rounded transition-colors duration-200"
                >
                Test This Task
                </button>
              </div>
                    
                    <div key={item.id} className="mt-2">
                      <TaskNotes
                        taskId={item.id}
                        notes={notes[item.id] || []}
                        onSaveNote={(content) => handleSaveNote(item.id, content)}
                        onDeleteNote={deleteNote}
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
