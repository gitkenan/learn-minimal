// components/LearningChat.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';

export default function LearningChat({ planId, topic }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentDiscussion, setCurrentDiscussion] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadOrCreateDiscussion = async () => {
      const supabase = initializeSupabase();
      
      // Try to find existing discussion
      let { data: discussions } = await supabase
        .from('plan_discussions')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (!discussions) {
        // Create new discussion if none exists
        const { data: newDiscussion } = await supabase
          .from('plan_discussions')
          .insert({
            plan_id: planId,
            user_id: user.id,
            title: `Discussion about ${topic}`
          })
          .select()
          .single();
        
        discussions = newDiscussion;
      }

      setCurrentDiscussion(discussions);

      // Load existing messages
      if (discussions) {
        const { data: existingMessages } = await supabase
          .from('discussion_messages')
          .select('*')
          .eq('discussion_id', discussions.id)
          .order('created_at', { ascending: true });

        if (existingMessages) {
          setMessages(existingMessages);
        }
      }
    };

    if (planId && user) {
      loadOrCreateDiscussion();
    }
  }, [planId, user, topic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      // Save user message
      const supabase = initializeSupabase();
      const { data: userMessage } = await supabase
        .from('discussion_messages')
        .insert({
          discussion_id: currentDiscussion.id,
          content: messageContent,
          is_ai: false
        })
        .select()
        .single();

      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          topic,
          discussionId: currentDiscussion.id,
          planId: planId
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      // Save AI response
      const { data: aiMessage } = await supabase
        .from('discussion_messages')
        .insert({
          discussion_id: currentDiscussion.id,
          content: data.response,
          is_ai: true
        })
        .select()
        .single();

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Learning Assistant</h2>
        <p className="text-sm text-gray-600">
          Ask questions about {topic}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.is_ai ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.is_ai 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-blue-500 text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask anything about the topic..."
            disabled={isLoading}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}