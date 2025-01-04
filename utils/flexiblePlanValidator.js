// utils/flexiblePlanValidator.js

export function validatePlanStructure(content) {
  const results = {
    isValid: true,
    errors: [],
    stats: {
      totalCheckboxItems: 0,
      contentLength: content.length,
      sections: []
    }
  };

  // Basic content validation
  if (!content || content.trim().length < 200) {
    results.errors.push('Content too short');
    results.isValid = false;
    return results;
  }

  // Find all sections (any level heading)
  const sections = content.split(/^#+\s+/m).filter(Boolean);
  results.stats.sections = sections.map(s => s.split('\n')[0].trim());

  // Count checkboxes/tasks
  const checkboxMatches = content.match(/\[[\sx]\]/g) || [];
  results.stats.totalCheckboxItems = checkboxMatches.length;

  // Basic requirements
  if (checkboxMatches.length < 3) {
    results.errors.push('Plan should have at least 3 actionable tasks');
  }

  if (sections.length < 2) {
    results.errors.push('Plan should have at least 2 sections');
  }

  // Check if timeline exists somewhere (more flexibly)
  const hasTimeline = content.toLowerCase().includes('timeline') || 
                     content.toLowerCase().includes('schedule') ||
                     content.toLowerCase().includes('time breakdown');
  
  if (!hasTimeline) {
    results.errors.push('Missing timeline or schedule information');
  }

  results.isValid = results.errors.length === 0;
  return results;
}