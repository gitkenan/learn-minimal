import React, { useState, useEffect } from 'react';
import { initializeSupabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

const parseMarkdownPlan = markdown => {
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;
  let currentItems = [];
  
  const generateId = () => Math.random().toString(36).substr(2, 9);

  let inTimelineSection = false;
  let timelineItems = [];

  for (const line of lines) {
    // Main section headers
    if (line.startsWith('## ') || line.startsWith('# ')) {
      if (currentSection) {
        sections.push({
          ...currentSection,
          items: currentItems
        });
      }
      
      currentItems = [];
      currentSection = {
        id: generateId(),
        title: line.replace(/^#+\s+/, '').trim(),
        type: line.toLowerCase().includes('phase') ? 'phase' : 
              line.toLowerCase().includes('resources') ? 'resources' :
              line.toLowerCase().includes('timeline') ? 'timeline' : 'section'
      };

      inTimelineSection = currentSection.type === 'timeline';
      continue;
    }

    // Handle all items under Timeline section
    if (inTimelineSection && line.trim()) {
      if (line.startsWith('- ')) {
        currentItems.push({
          id: generateId(),
          type: 'text',
          content: line.slice(2).trim()
        });
      }
      continue;
    }

    // Handle checkbox items
    const checkboxMatch = line.match(/^-?\s*\[([\sx])\]\s*(.+)/);
    if (checkboxMatch && currentSection) {
      currentItems.push({
        id: generateId(),
        type: 'task',
        content: checkboxMatch[2].trim(),
        isComplete: checkboxMatch[1] === 'x'
      });
      continue;
    }

    // Handle regular items starting with - or **
    if ((line.startsWith('- ') || line.startsWith('**')) && currentSection) {
      currentItems.push({
        id: generateId(),
        type: 'text',
        content: line.replace(/^\*\*|\*\*$/g, '').replace(/^- /, '').trim()
      });
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      items: currentItems
    });
  }

  return {
    sections,
    progress: calculateProgress(sections)
  };
};

const calculateProgress = sections => {
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
};

const MarkdownPlan = ({ initialContent, planId, onProgressUpdate }) => {
  const [content, setContent] = useState(initialContent);
  const [parsedContent, setParsedContent] = useState(null);
  const [isJsonMode, setIsJsonMode] = useState(false);

  useEffect(() => {
    const parsed = parseMarkdownPlan(initialContent);
    setParsedContent(parsed);
  }, [initialContent]);

  const handleCheckboxClick = async (sectionId, itemId) => {
    if (!parsedContent) return;

    const newParsedContent = {
      ...parsedContent,
      sections: parsedContent.sections.map(section => {
        if (section.id !== sectionId) return section;
        
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, isComplete: !item.isComplete };
          })
        };
      })
    };

    const newProgress = calculateProgress(newParsedContent.sections);

    try {
      const supabase = initializeSupabase();
      const { error } = await supabase
        .from('plans')
        .update({ 
          content: JSON.stringify(newParsedContent),
          progress: newProgress 
        })
        .eq('id', planId);

      if (error) throw error;
      
      setParsedContent(newParsedContent);
      onProgressUpdate(newProgress);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const renderJsonContent = () => {
  if (!parsedContent) return null;

  const phaseSections = parsedContent.sections.filter(s => s.type === 'phase');
  const otherContent = content.substring(content.indexOf('## Resources'));

  return (
    <div className="space-y-6">
      {phaseSections.map(section => (
        <div key={section.id} className="space-y-2">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <div className="space-y-2">
            {section.items.map(item => (
              <div key={item.id} className="ml-4">
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
                    <span className={item.isComplete ? 'text-gray-500 line-through' : 'text-gray-900'}>
                      {item.content}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-900">{item.content}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-8">
        <ReactMarkdown>{otherContent}</ReactMarkdown>
      </div>
    </div>
  );
  };

  return (
    <div className="prose max-w-none">
      <div className="mb-4">
        <button 
          onClick={() => setIsJsonMode(!isJsonMode)}
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Switch to {isJsonMode ? 'Markdown' : 'JSON'} Mode
        </button>
      </div>
      {isJsonMode ? renderJsonContent() : (
        <pre className="whitespace-pre-wrap">{content}</pre>
      )}
    </div>
  );
};

export default MarkdownPlan;