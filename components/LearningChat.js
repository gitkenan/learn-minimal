// components/LearningChat.js
import React, { useRef, useState } from 'react';
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


  if (isInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 mt-2">Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 border-b bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="gradient-text text-lg font-semibold">Learning Assistant</h2>
          <button
            onClick={startNewDiscussion}
            className="px-3 py-1 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover"
          >
            New Chat
          </button>
        </div>
        
        {discussions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {discussions.map(discussion => (
              <button
                key={discussion.id}
                onClick={() => setCurrentDiscussion(discussion)}
                className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap ${
                  currentDiscussion?.id === discussion.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {discussion.title}
              </button>
            ))}
          </div>
        )}
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
                className={`max-w-[80%] rounded-lg p-3 break-words prose prose-invert ${
                  message.is_ai 
                    ? 'bg-background text-primary prose-headings:text-primary prose-a:text-accent' 
                    : 'bg-accent text-white prose-headings:text-white prose-a:text-white'
                }`}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
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