import { useState, useEffect } from 'react';
import { initializeSupabase } from '@/lib/supabaseClient';

// Parser function that converts markdown to structured data
function parseMarkdownPlan(markdown) {
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

function calculateProgress(sections) {
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

// The React component
const MarkdownPlan = ({ initialContent, planId, onProgressUpdate }) => {
  const [content, setContent] = useState(initialContent);
  const [parsedContent, setParsedContent] = useState({ sections: [], progress: 0 });

  useEffect(() => {
    setParsedContent(parseMarkdownPlan(content));
  }, [content]);

  const handleCheckboxClick = async (sectionId, itemId) => {
    const newSections = parsedContent.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id === itemId && item.type === 'task') {
              return { ...item, isComplete: !item.isComplete };
            }
            return item;
          })
        };
      }
      return section;
    });

    const newParsedContent = {
      sections: newSections,
      progress: calculateProgress(newSections)
    };

    setParsedContent(newParsedContent);
    
    if (onProgressUpdate) {
      onProgressUpdate(newParsedContent.progress);
    }
  };

  return (
    <div className="space-y-8">
      {parsedContent.sections.map(section => (
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
              <div key={item.id}>
                {item.type === 'task' ? (
                  <div 
                    className="flex items-start gap-2 cursor-pointer group"
                    onClick={() => handleCheckboxClick(section.id, item.id)}
                  >
                    <div className={`
                      mt-1 w-4 h-4 border rounded flex items-center justify-center
                      ${item.isComplete ? 'bg-accent border-accent' : 'border-gray-300'}
                      group-hover:border-accent transition-colors duration-200
                    `}>
                      {item.isComplete && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      )}
                    </div>
                    <span 
                      className={item.isComplete ? 'text-gray-500 line-through' : 'text-gray-900'}
                      dangerouslySetInnerHTML={{ __html: item.content }}
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

// Make sure we have both a default export and named exports
export default MarkdownPlan;
export { parseMarkdownPlan, calculateProgress };