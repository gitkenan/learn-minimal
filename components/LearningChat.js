// components/LearningChat.js
import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '@/hooks/useChat';
import { Loading } from './ui/loading';

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
        <Loading
          variant="spinner"
          size="sm"
          message={isCreatingDiscussion ? 'Starting new chat...' : 'Initializing chat...'}
          className="text-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 border-b bg-white">
      <div className="flex items-center gap-4">
        <div className="flex-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {discussions.map(discussion => (
          <button
            key={discussion.id}
            onClick={() => setCurrentDiscussion(discussion)}
            className={`flex-none px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
            currentDiscussion?.id === discussion.id
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {discussion.title}
          </button>
          ))}
        </div>
        </div>
        <button
        onClick={startNewDiscussion}
        className="flex-none p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        </button>
      </div>
      </div>




        <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
        {currentDiscussion ? (
          messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.is_ai ? 'justify-start' : 'justify-end'}`}
          >
            <div
            className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              message.is_ai 
              ? message.is_system
              ? 'bg-gray-100 text-gray-800' 
              : 'bg-white text-gray-800 shadow-sm'
              : 'bg-primary text-white'
            } ${message.is_ai ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
            >
            {message.is_system ? (
              <div className="space-y-2 text-sm">
              <div className="font-medium">{message.content.split('\n\n')[0]}</div>
              {message.content.split('\n\n').slice(1).map((part, i) => (
                <div key={i} className="text-gray-600">{part}</div>
              ))}
              </div>
            ) : (
              <ReactMarkdown className={`prose ${message.is_ai ? 'prose-gray' : 'prose-invert'} max-w-none`}>
              {message.content}
              </ReactMarkdown>
            )}
            </div>
          </div>
          ))
        ) : (
          <div className="text-center text-gray-500 mt-8">
          <p>Select a chat or start a new one</p>
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
            ? 'Select a chat first...' 
            : isLoading 
              ? 'Sending...' 
              : 'Type your message...'
          }
          disabled={isLoading || !currentDiscussion}
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
          />
          <button
          type="submit"
          disabled={isLoading || !currentDiscussion || !newMessage.trim()}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loading
                variant="spinner"
                size="sm"
                className="text-white border-white"
              />
              <span>Sending</span>
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