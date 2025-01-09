import { 
  detectSectionType,
  calculateProgress,
  baseMarkdownParser
} from './planParserUtils';

export function parseLearningPlanViewer(markdown) {
  const sections = baseMarkdownParser(markdown);
  const progress = calculateProgress(sections);

  return {
    sections,
    progress
  };
}
