// components/LearningChat.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

export default function LearningChat({ planId, topic }) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [currentDiscussion, setCurrentDiscussion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  // Load all discussions for this plan
  useEffect(() => {
    const loadDiscussions = async () => {
      if (!planId || !user) return;
      
      try {
        const supabase = initializeSupabase();
        const { data, error } = await supabase
          .from('plan_discussions')
          .select('*')
          .eq('plan_id', planId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (!data || data.length === 0) {
          // Automatically start first chat if no discussions exist
          await startNewDiscussion();
        } else {
          setDiscussions(data);
          setCurrentDiscussion(data[0]); // Set the most recent discussion as current
        }
        setIsInitializing(false);
      } catch (err) {
        console.error('Error loading discussions:', err);
        setError('Failed to load chat history');
        setIsInitializing(false);
      }
    };

    loadDiscussions();
  }, [planId, user]);

  // Load messages when a discussion is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentDiscussion) {
        setMessages([]);
        return;
      }

      try {
        const supabase = initializeSupabase();
        const { data, error } = await supabase
          .from('discussion_messages')
          .select('*')
          .eq('discussion_id', currentDiscussion.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Scroll to bottom after messages load
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      }
    };

    loadMessages();
  }, [currentDiscussion]);

  const startNewDiscussion = async () => {
    try {
      const supabase = initializeSupabase();
      const title = `Chat ${discussions.length + 1}`;
      
      const { data, error } = await supabase
        .from('plan_discussions')
        .insert([{
          plan_id: planId,
          user_id: user.id,
          title,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setDiscussions(prev => [data, ...prev]);
      setCurrentDiscussion(data);
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('Error creating new discussion:', err);
      setError('Failed to start new chat');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading || !currentDiscussion) return;

    setIsLoading(true);
    const messageContent = newMessage;
    setNewMessage('');
    setError(null);

    try {
      const supabase = initializeSupabase();
      
      // Add user message
      const { data: userMessage, error: messageError } = await supabase
        .from('discussion_messages')
        .insert({
          discussion_id: currentDiscussion.id,
          content: messageContent,
          is_ai: false
        })
        .select()
        .single();

      if (messageError) throw messageError;
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          topic,
          discussionId: currentDiscussion.id,
          planId
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      // Save AI response
      const { data: aiMessage, error: aiError } = await supabase
        .from('discussion_messages')
        .insert({
          discussion_id: currentDiscussion.id,
          content: data.response,
          is_ai: true
        })
        .select()
        .single();

      if (aiError) throw aiError;
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error in chat:', err);
      setError('Failed to send message. Please try again.');
      setNewMessage(messageContent);
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-lg font-semibold">Learning Assistant</h2>
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
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
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