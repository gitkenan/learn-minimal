// components/LearningChat.js
import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '@/hooks/useChat';

export default function LearningChat({ planId, topic, initialContext }) {
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef(null);
  
  const {
    discussions,
    currentDiscussion,
    messages,
    isLoading,
    isInitializing,
    error,
    startNewDiscussion,
    sendMessage,
    setCurrentDiscussion
  } = useChat({
    planId,
    topics: topic,
    initialContext: initialContext || `This chat is about: ${topic}`
  });

  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);

  // Start new discussion on mount
  useEffect(() => {
    const createInitialDiscussion = async () => {
      if (!currentDiscussion && !isInitializing) {
        setIsCreatingDiscussion(true);
        try {
          await startNewDiscussion();
        } catch (err) {
          console.error('Failed to create initial discussion:', err);
        } finally {
          setIsCreatingDiscussion(false);
        }
      }
    };
    createInitialDiscussion();
  }, [currentDiscussion, isInitializing, startNewDiscussion]);


  // Scroll to bottom after messages load
  React.useEffect(() => {
    setTimeout(() => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading || !currentDiscussion) return;

    const messageContent = newMessage;
    setNewMessage('');
    await sendMessage(messageContent);
  };


  if (isInitializing || isCreatingDiscussion) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 mt-2">
          {isCreatingDiscussion ? 'Starting new chat...' : 'Initializing chat...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex-none p-4 border-b">
          <h2 className="gradient-text text-lg font-semibold mb-3">Learning Assistant</h2>
          
          <div className="flex items-center">
          <div className="flex-1 min-w-0 relative"> {/* Container for scroll area */}
            <div className="max-w-full overflow-x-auto no-scrollbar">
            <style jsx>{`
              .no-scrollbar::-webkit-scrollbar {
              display: none;
              }
              .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
              }
            `}</style>
            <div className="inline-flex gap-2 pr-2"> {/* inline-flex prevents wrapping */}
              {discussions.map(discussion => (
              <button
                key={discussion.id}
                onClick={() => setCurrentDiscussion(discussion)}
                className={`flex-none px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors duration-200 ${
                currentDiscussion?.id === discussion.id
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {discussion.title}
              </button>
              ))}
            </div>
            </div>
          </div>
          <div className="flex-none pl-3 bg-white">
            <button
            onClick={startNewDiscussion}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="New Chat"
            >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            </button>
          </div>
          </div>
        </div>



      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}
      >
        {currentDiscussion ? (
            messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_ai ? 'justify-start' : 'justify-end'}`}
            >
                <div
                className={`max-w-[80%] rounded-lg p-3 break-words ${
                  message.is_ai 
                  ? message.is_system
                    ? 'bg-gray-50 text-gray-800 border border-gray-200 prose prose-sm max-w-none' 
                    : 'bg-background text-primary prose prose-invert prose-headings:text-primary prose-a:text-accent'
                  : 'bg-accent text-white prose prose-invert prose-headings:text-white prose-a:text-white'
                }`}
                >
                {message.is_system ? (
                  <div className="space-y-2">
                  <div className="font-medium">{message.content.split('\n\n')[0]}</div>
                  {message.content.split('\n\n').slice(1).map((part, i) => (
                    <div key={i} className="text-gray-600">{part}</div>
                  ))}
                  </div>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
                </div>
            </div>
            ))
        ) : (
          <div className="text-center text-gray-500">
            <p>Start a new chat or select an existing one</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex-none p-2 bg-red-50 border-t border-red-100">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-none p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              !currentDiscussion 
                ? 'Start or select a chat first...' 
                : isLoading 
                  ? 'Sending...' 
                  : 'Ask anything about the topic...'
            }
            disabled={isLoading || !currentDiscussion}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isLoading || !currentDiscussion || !newMessage.trim()}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent whitespace-nowrap"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}