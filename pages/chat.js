// pages/chat.js
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessageToApi = async (message) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          discussionId
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    // Add user message immediately
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: inputMessage.trim(),
      isAI: false
    }]);

    const userInput = inputMessage.trim();
    setInputMessage('');

    // Get AI response
    const aiResponse = await sendMessageToApi(userInput);
    if (aiResponse) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: aiResponse,
        isAI: true
      }]);
    }
  };

  return (
      <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] bg-surface rounded-xl border border-accent-DEFAULT/10">
        {/* Chat Header */}
        <div className="flex items-center p-4 border-b border-accent-DEFAULT/10 bg-white/90 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-accent-DEFAULT flex items-center justify-center shadow-soft">
              <span className="text-white font-semibold text-lg">AI</span>
            </div>
            <div>
              <h2 className="text-h3 text-primary font-semibold">Learning Assistant</h2>
              <p className="text-sm text-secondary">Ready to help you learn</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-surface">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              <div
                className={message.isAI ? 'chat-message-ai p-4' : 'chat-message-user p-4'}
              >
                <p className="text-pretty leading-relaxed">
                  {message.content}
                </p>
                <div className="chat-message-timing mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-accent-DEFAULT/10 bg-white/90 backdrop-blur-sm rounded-b-xl">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="w-full pr-24 py-3 px-4 bg-surface border border-accent-DEFAULT/20 rounded-xl 
                         focus:border-accent-DEFAULT focus:ring-2 focus:ring-accent-DEFAULT/10 
                         disabled:opacity-50 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="absolute right-2 h-10 px-4 bg-accent-DEFAULT text-white rounded-lg
                         hover:bg-accent-hover transition-colors disabled:opacity-50 
                         disabled:hover:bg-accent-DEFAULT click-shrink"
            >
              {isLoading ? (
                <span className="flex items-center space-x-1">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                </span>
              ) : (
                'Send'
              )}
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
  );
}
