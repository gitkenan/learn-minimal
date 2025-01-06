import { useState, useEffect } from 'react';
import TaskNotes from './TaskNotes';
import { usePlan } from '@/hooks/usePlan';

// Helper function to validate JSON structure
function isValidPlanStructure(content) {
  return content?.sections?.length > 0 && 
         content.sections.every(section => 
           section.id && section.title && Array.isArray(section.items));
}

// Parser function that converts markdown to structured data
export function parseMarkdownPlan(markdown) {
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;

  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  // Function to process text content and handle markdown formatting
  const processContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Handle bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Handle italics
      .replace(/`(.*?)`/g, '<code>$1</code>')           // Handle inline code
      .replace(/\[([\sx])\]/g, '')                     // Replace checkboxes with a nice symbol
      .trim();
  };

  lines.forEach((line, index) => {
    // Skip the first h1 heading as it will be used as the title
    if (index === 0 && line.startsWith('# ')) {
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    
    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        id: generateId(),
        headingLevel: headingMatch[1].length,
        title: processContent(headingMatch[2].trim()),
        type: detectSectionType(headingMatch[2].trim()),
        items: []
      };
    } else if (currentSection) {
      const checkboxMatch = line.match(/^-?\s*\[([\sx])\]\s*(.+)/);
      if (checkboxMatch) {
        currentSection.items.push({
          id: generateId(),
          type: 'task',
          isComplete: checkboxMatch[1].toLowerCase() === 'x',
          content: processContent(checkboxMatch[2].trim())
        });
      } 
      else if (line.trim().startsWith('- ')) {
        currentSection.items.push({
          id: generateId(),
          type: 'text',
          content: processContent(line.replace(/^-\s+/, '').trim())
        });
      }
      else if (line.trim()) {
        currentSection.items.push({
          id: generateId(),
          type: 'text',
          content: processContent(line.trim())
        });
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  const progress = calculateProgress(sections);

  return {
    sections,
    progress
  };
}

function detectSectionType(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('phase')) return 'phase';
  if (lowerTitle.includes('resource')) return 'resources';
  if (lowerTitle.includes('timeline')) return 'timeline';
  return 'section';
}

export function calculateProgress(sections) {
  let totalTasks = 0;
  let completedTasks = 0;

  sections.forEach(section => {
    section.items.forEach(item => {
      if (item.type === 'task') {
        totalTasks++;
        if (item.isComplete) completedTasks++;
      }
    });
  });

  return totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

const LearningPlanViewer = ({ 
  initialContent, 
  planId, 
  onProgressUpdate,
  contentType = 'json'
}) => {
  const { 
    plan,
    notes,  // Now getting notes from the hook
    loading,
    error,
    updating,
    toggleTask,
    saveNote
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
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();

    try {
      await toggleTask(sectionId, itemId);
    } catch (error) {
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
      {parsedContent?.sections.map(section => (
        <div key={section.id} className="space-y-4">
          {section.headingLevel === 2 ? (
            <h2 
              className="text-2xl font-semibold"
              dangerouslySetInnerHTML={{ __html: section.title }}
            />
          ) : (
            <h3 
              className="text-xl font-semibold"
              dangerouslySetInnerHTML={{ __html: section.title }}
            />
          )}

          <div className="space-y-2 ml-4">
            {section.items.map(item => (
              <div key={item.id} className="relative">
                {item.type === 'task' ? (
                  <div>
                    <button
                      className={`w-full text-left flex items-start gap-2 p-2 rounded
                        ${updating ? 'opacity-50' : 'hover:bg-gray-50 active:bg-gray-100'}
                        transition-colors duration-200 touch-manipulation`}
                      onClick={(e) => handleTaskInteraction(e, section.id, item.id)}
                      disabled={updating}
                      role="checkbox"
                      aria-checked={item.isComplete}
                    >
                      <div className={`
                        mt-1 min-w-4 h-4 border rounded flex items-center justify-center
                        ${item.isComplete ? 'bg-accent border-accent' : 'border-gray-300'}
                        transition-colors duration-200
                      `}>
                        {item.isComplete && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        )}
                      </div>
                      <span 
                        className={`flex-1 ${item.isComplete ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </button>
                    
                    <TaskNotes
                      taskId={item.id}
                      notes={notes[item.id] || []}
                      onSaveNote={(content) => handleSaveNote(item.id, content)}
                    />
                  </div>
                ) : (
                  <div 
                    className="text-gray-900 ml-6"
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