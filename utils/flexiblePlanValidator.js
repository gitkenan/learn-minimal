// utils/flexiblePlanValidator.js

export function validatePlanStructure(content) {
  const results = {
    isValid: true,
    errors: [],
    stats: {
      totalCheckboxItems: 0,
      contentLength: content.length
    }
  };

  // Basic content check
  if (!content || content.trim().length < 100) {
    results.errors.push('Content too short');
  }

  // Count checkboxes/tasks
  const checkboxMatches = content.match(/\[[\sx]\]/g) || [];
  results.stats.totalCheckboxItems = checkboxMatches.length;

  // Ensure we have at least 3 tasks
  if (results.stats.totalCheckboxItems < 3) {
    results.errors.push('Plan should have at least 3 tasks');
  }

  // Make sure there's some structure (at least one heading)
  if (!content.includes('#')) {
    results.errors.push('Missing section headers');
  }

  results.isValid = results.errors.length === 0;
  return results;
}