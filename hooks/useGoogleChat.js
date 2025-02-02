import { useState, useCallback } from 'react';

export const useGoogleChat = (initialHistory = []) => {
  const [messages, setMessages] = useState(initialHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(() => Date.now().toString());

  const sendMessage = useCallback(async (message, systemPrompt) => {
    setIsLoading(true);
    setError(null);

    try {
      // Add user message immediately for optimistic UI
      setMessages(prev => [...prev, { 
        id: Date.now(),
        content: message, 
        isAI: false 
      }]);

      const response = await fetch('/api/g-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          systemPrompt,
          sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const { response: aiResponse } = await response.json();

      // Add AI response
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: aiResponse,
        isAI: true
      }]);

    } catch (error) {
      setError(error.message);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setSessionId(Date.now().toString());
  }, []);

  return { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    resetChat 
  };
};
