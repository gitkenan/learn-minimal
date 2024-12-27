// Utility to validate AI-generated learning plans
export function validatePlanStructure(content) {
    // Required sections with specific validation rules
    const requiredSections = [
      {
        header: '# Learning Plan',
        required: true,
        rules: []
      },
      {
        header: '## Phase 1: Fundamentals',
        required: true,
        rules: [
          content => {
            const section = extractSection(content, 'Phase 1: Fundamentals');
            const hasCheckboxes = (section.match(/\[[\sx]\]/g) || []).length >= 3;
            return {
              valid: hasCheckboxes,
              message: 'Phase 1 should have at least 3 checkbox items'
            };
          },
          content => {
            const section = extractSection(content, 'Phase 1: Fundamentals');
            const items = section.split('\n').filter(line => line.includes('[ ]'));
            const uniquePhrasing = new Set(items).size === items.length;
            return {
              valid: uniquePhrasing,
              message: 'Phase 1 items should have distinct phrasing'
            };
          }
        ]
      },
      {
        header: '## Phase 2: Deep Dive',
        required: true,
        rules: [
          content => {
            const section = extractSection(content, 'Phase 2: Deep Dive');
            const hasCheckboxes = (section.match(/\[[\sx]\]/g) || []).length >= 3;
            return {
              valid: hasCheckboxes,
              message: 'Phase 2 should have at least 3 checkbox items'
            };
          }
        ]
      },
      {
        header: '## Phase 3: Application',
        required: true,
        rules: [
          content => {
            const section = extractSection(content, 'Phase 3: Application');
            const hasCheckboxes = (section.match(/\[[\sx]\]/g) || []).length >= 3;
            return {
              valid: hasCheckboxes,
              message: 'Phase 3 should have at least 3 checkbox items'
            };
          }
        ]
      },
      {
        header: '## Resources',
        required: true,
        rules: [
          content => {
            const section = extractSection(content, 'Resources');
            const hasCheckboxes = (section.match(/\[[\sx]\]/g) || []).length >= 1;
            return {
              valid: hasCheckboxes,
              message: 'Resources section should have at least 1 checkbox item'
            };
          }
        ]
      },
      {
        header: '## Timeline',
        required: true,
        rules: [
          content => {
            const section = extractSection(content, 'Timeline');
            const hasNoCheckboxes = !(section || '').includes('[ ]');
            return {
              valid: hasNoCheckboxes,
              message: 'Timeline section should not contain checkboxes'
            };
          },
          content => {
            const section = extractSection(content, 'Timeline');
            const lines = section.split('\n').filter(line => line.trim());
            // Allow up to 3 lines for the timeline, as long as it's concise
            return {
              valid: lines.length <= 3 && lines.length > 0,
              message: 'Timeline section should be a concise paragraph (1-3 lines)'
            };
          }
        ]
      }
    ];
  
    // Helper function to extract section content
    function extractSection(content, sectionName) {
      const sections = content.split(/^## /m);
      const section = sections.find(s => s.trim().startsWith(sectionName));
      return section || '';
    }
  
    // Validation results
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalCheckboxItems: 0,
        sectionsFound: [],
        contentLength: content.length,
        sectionLengths: {}
      }
    };
  
    // Check for all required sections
    for (const section of requiredSections) {
      if (!content.includes(section.header)) {
        results.errors.push(`Missing required section: ${section.header}`);
        results.isValid = false;
      } else {
        results.stats.sectionsFound.push(section.header);
        
        // Run section-specific validation rules
        const sectionContent = extractSection(content, section.header.replace(/^#+ /, ''));
        results.stats.sectionLengths[section.header] = sectionContent.length;
  
        for (const rule of section.rules) {
          const ruleResult = rule(content);
          if (!ruleResult.valid) {
            results.errors.push(ruleResult.message);
            results.isValid = false;
          }
        }
      }
    }
  
    // Check minimum content length (1000 characters for a thorough plan)
    if (content.length < 1000) {
      results.errors.push('Content length is too short (minimum 1000 characters)');
      results.isValid = false;
    }
  
    // Count total checkbox items
    const checkboxLines = content.match(/\[[\sx]\]/g) || [];
    results.stats.totalCheckboxItems = checkboxLines.length;
  
    // Check for consistency in checkbox formatting
    const invalidCheckboxes = content.match(/\[[^\sx]\]/g) || [];
    if (invalidCheckboxes.length > 0) {
      results.errors.push('Found checkboxes with invalid format');
      results.isValid = false;
    }
  
    // Check for repetitive phrasing across all tasks
    const allTasks = content.match(/\[[\sx]\].*$/gm) || [];
    const uniqueTasks = new Set(allTasks.map(task => task.toLowerCase().trim()));
    if (uniqueTasks.size !== allTasks.length) {
      results.warnings.push('Some tasks may have repetitive phrasing');
    }
  
    return results;
  }