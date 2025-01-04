import React, { useState } from 'react';
import { parseMarkdownPlan } from '@/components/MarkdownPlan';

const testCases = [
  {
    name: "Standard Format",
    content: `# Learning Plan for Test
## Phase 1: Fundamentals
[ ] Task 1
[ ] Task 2

## Phase 2: Deep Dive
[ ] Task 3
[ ] Task 4

## Resources
[ ] Resource 1

## Timeline
Follow the schedule weekly.`
  },
  {
    name: "Different Heading Variations",
    content: `# Study Plan
## Getting Started: Core Concepts
[ ] Task 1
[ ] Task 2

## Advanced Topics
[ ] Task 3
[ ] Task 4

## Additional Resources
[ ] Resource 1

## Suggested Timeline
Week by week approach.`
  },
  {
    name: "Mixed Heading Levels",
    content: `# Main Plan
### Quick Start
[ ] Task 1

## Phase One
[ ] Task 2

#### Deep Dive
[ ] Task 3

## References
[ ] Ref 1

## Schedule
Monthly plan.`
  },
  {
    name: "Extra Sections",
    content: `# Extended Plan
## Initial Phase
[ ] Task 1

## Secondary Phase
[ ] Task 2

## Bonus Material
[ ] Extra 1

## Resources
[ ] Resource 1

## Study Timeline
Flexible schedule.

## Notes
Additional notes here.`
  }
];

export default function ParserTest() {
  const [selectedTest, setSelectedTest] = useState(0);
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState(null);

  const runTest = (index) => {
    try {
      setSelectedTest(index);
      const result = parseMarkdownPlan(testCases[index].content);
      setParsedResult(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      setParsedResult(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Parser Test Cases</h2>
        <div className="flex flex-wrap gap-2">
          {testCases.map((test, index) => (
            <button
              key={index}
              onClick={() => runTest(index)}
              className={`px-4 py-2 rounded-lg ${
                selectedTest === index
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {test.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input markdown */}
        <div className="space-y-2">
          <h3 className="font-semibold">Input Markdown</h3>
          <pre className="p-4 bg-gray-50 rounded-lg overflow-auto max-h-[500px] whitespace-pre-wrap">
            {testCases[selectedTest].content}
          </pre>
        </div>

        {/* Parsed output */}
        <div className="space-y-2">
          <h3 className="font-semibold">Parsed Output</h3>
          {error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          ) : parsedResult ? (
            <div className="p-4 bg-gray-50 rounded-lg overflow-auto max-h-[500px]">
              <div className="space-y-4">
                {parsedResult.sections.map((section) => (
                  <div key={section.id}>
                    <h4 className="font-medium">
                      {section.title} ({section.type})
                    </h4>
                    <ul className="ml-4 space-y-1">
                      {section.items.map((item) => (
                        <li key={item.id} className="text-sm">
                          {item.type === 'task' ? '☐' : '•'} {item.content}
                          {item.type === 'task' && 
                            <span className="text-gray-500 text-xs ml-2">
                              [Complete: {item.isComplete ? 'Yes' : 'No'}]
                            </span>
                          }
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  Overall Progress: {parsedResult.progress}%
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 text-gray-500 rounded-lg">
              Run a test to see parsed output
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
