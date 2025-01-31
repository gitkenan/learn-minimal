import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Layout from '@/components/Layout';
import { useGoogleChat } from '@/hooks/useGoogleChat';

export default function ChatPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { messages, isLoading, error, initializeChat, sendMessage } = useGoogleChat();
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    initializeChat(`You are a learning assistant with expertise in personalized education...`);
  }, [initializeChat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage.trim());
    setInputMessage('');
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] bg-white/80 backdrop-blur-sm rounded-xl border border-[#3c6e47]/10">
        {/* Chat Header */}
        <div className="flex items-center p-4 border-b border-[#3c6e47]/10 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-accent-DEFAULT flex items-center justify-center">
              <span className="text-white font-semibold">AI</span>
            </div>
            <h2 className="text-h3 text-primary">Learning Assistant</h2>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[65%] p-4 rounded-2xl ${
                  message.isAI 
                    ? 'bg-surface border border-accent-DEFAULT/10 text-primary'
                    : 'bg-accent-DEFAULT text-white'
                }`}
              >
                <p className="leading-relaxed text-pretty">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#3c6e47]/10 bg-white/90 backdrop-blur-sm">
          <div className="relative">
            <form onSubmit={handleSubmit} className="w-full">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="w-full pr-16 bg-surface border border-accent-DEFAULT/10 rounded-xl focus:border-accent-DEFAULT/30"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-accent-DEFAULT text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
          <p className="text-center text-sm text-secondary/60 mt-2">
            AI assistant powered by your learning content
          </p>
        </div>
      </div>
    </Layout>
  );
}
