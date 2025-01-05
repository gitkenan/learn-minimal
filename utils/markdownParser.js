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
  
  export function parseLearningPlanViewer(markdown) {
    const lines = markdown.split('\n');
    const sections = [];
    let currentSection = null;
  
    const generateId = () => Math.random().toString(36).substr(2, 9);
  
    lines.forEach((line) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
      
      if (headingMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
  
        currentSection = {
          id: generateId(),
          headingLevel: headingMatch[1].length,
          title: headingMatch[2].trim(),
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
            content: checkboxMatch[2].trim()
          });
        } 
        else if (line.trim().startsWith('- ')) {
          currentSection.items.push({
            id: generateId(),
            type: 'text',
            content: line.replace(/^-\s+/, '').trim()
          });
        }
        else if (line.trim()) {
          currentSection.items.push({
            id: generateId(),
            type: 'text',
            content: line.trim()
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