import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const customStyle = {
  'code[class*="language-"]': {
    color: '#e3e3e3',
    background: 'none',
  },
  'pre[class*="language-"]': {
    color: '#e3e3e3',
    background: '#2F3B2F',
    margin: 0,
    padding: '1rem',
    borderRadius: '0.5rem',
  },
  comment: {
    color: '#94B49F'  // accent.secondary
  },
  function: {
    color: '#7FB069'  // accent.DEFAULT
  },
  keyword: {
    color: '#ABC4A1'  // accent.muted
  }
};

export default function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-2 mb-4">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-medium rounded-md 
                   bg-accent hover:bg-accent-hover text-white
                   transition-colors duration-200"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'javascript'}
        style={customStyle}
        className="!bg-chat-background rounded-lg shadow-soft"
        showLineNumbers={true}
        wrapLines={true}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
