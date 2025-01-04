// utils/flexiblePlanValidator.js

export function validatePlanStructure(content) {
  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalCheckboxItems: 0,
      contentLength: content?.length || 0,
      sections: [],
      hasTitle: false,
      hasTimeline: false
    }
  };

  // Basic content validation
  if (!content || content.trim().length < 200) {
    results.errors.push('Content too short (minimum 200 characters)');
    results.isValid = false;
    return results;
  }

  // Split content into lines for analysis
  const lines = content.trim().split('\n');
  
  // Check for title (h1 heading)
  const titleMatch = lines.find(line => line.match(/^#\s+/));
  results.stats.hasTitle = !!titleMatch;
  if (!titleMatch) {
    results.errors.push('Missing main title (h1 heading)');
  }

  // Find all sections (any level heading)
  const sections = content.split(/^#+\s+/m).filter(Boolean);
  results.stats.sections = sections.map(s => s.split('\n')[0].trim());

  // Validate section structure
  if (sections.length < 2) {
    results.errors.push('Plan should have at least 2 sections');
  }

  // Count checkboxes/tasks
  const checkboxMatches = content.match(/\[[\sx]\]/g) || [];
  results.stats.totalCheckboxItems = checkboxMatches.length;

  if (checkboxMatches.length < 3) { // Increased minimum tasks
    results.errors.push('Plan should have at least 3 actionable tasks');
  }

  // Check markdown formatting
  const markdownFormatting = {
    bold: (content.match(/\*\*(.*?)\*\*/g) || []).length,
    italics: (content.match(/\*(.*?)\*/g) || []).length,
    inlineCode: (content.match(/`(.*?)`/g) || []).length,
    checkboxes: checkboxMatches.length
  };

  // Add formatting stats
  results.stats.formatting = markdownFormatting;

  // Check for Timeline section
  const timelineSection = sections.find(s => 
    s.toLowerCase().startsWith('timeline') || 
    s.toLowerCase().includes('# timeline')
  );
  results.stats.hasTimeline = !!timelineSection;

  if (!timelineSection) {
    results.warnings.push('Timeline section recommended');
  }

  // Check for Resources section
  const hasResources = sections.some(s => 
    s.toLowerCase().startsWith('resource') || 
    s.toLowerCase().includes('# resource')
  );
  results.stats.hasResources = hasResources;

  // Validate Timeline section format
  if (timelineSection) {
    const timelineCheckboxes = timelineSection.match(/\[[\sx]\]/g) || [];
    if (timelineCheckboxes.length > 0) {
      results.errors.push('Timeline section should not contain checkboxes');
    }
  }

  // Check formatting quality
  if (markdownFormatting.bold === 0 && markdownFormatting.italics === 0) {
    results.warnings.push('Consider using markdown formatting (bold/italics) for emphasis');
  }

  // Validate section titles
  const sectionTitles = lines
    .filter(line => line.match(/^#{2,}\s+/))
    .map(line => line.replace(/^#{2,}\s+/, '').trim());

  if (sectionTitles.some(title => title.length < 3)) {
    results.errors.push('Section titles should be descriptive (at least 3 characters)');
  }

  // Final validation
  results.isValid = results.errors.length === 0;
  return results;
}