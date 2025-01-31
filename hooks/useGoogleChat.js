import { useState, useCallback } from 'react';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const useGoogleChat = (initialHistory = []) => {
  const [messages, setMessages] = useState(initialHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatInstance, setChatInstance] = useState(null);

  const initializeChat = useCallback(async (systemPrompt) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        safetySettings: Object.values(HarmCategory).map(category => ({
          category,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        }))
      });
      
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          }
        ]
      });
      
      setChatInstance(chat);
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error('Chat initialization error:', error);
    }
  }, []);

  const sendMessage = useCallback(async (message, stream = false) => {
    if (!chatInstance) {
      setError('Chat not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add user message immediately for optimistic UI
      setMessages(prev => [...prev, { 
        id: Date.now(),
        content: message, 
        isAI: false 
      }]);

      const result = await chatInstance.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();

      // Add AI response
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: responseText,
        isAI: true
      }]);
    } catch (error) {
      setError(error.message);
      console.error('Message sending error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatInstance]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setChatInstance(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { 
    messages, 
    isLoading, 
    error, 
    initializeChat, 
    sendMessage, 
    resetChat 
  };
};
