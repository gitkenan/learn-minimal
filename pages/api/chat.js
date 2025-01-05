// pages/api/chat.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authenticated session
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, topic, discussionId, planId } = req.body;

    // Validate input
    if (!message || !topic || !discussionId || !planId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify discussion belongs to user and get plan content and messages
    const [discussionResult, planResult, messagesResult] = await Promise.all([
      supabase
        .from('plan_discussions')
        .select('*')
        .eq('id', discussionId)
        .eq('user_id', session.user.id)
        .single(),
      supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', session.user.id)
        .single(),
      supabase
        .from('discussion_messages')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true })
    ]);

    if (!discussionResult.data || !planResult.data) {
      return res.status(403).json({ error: 'Not authorized to access this content' });
    }

    const planContent = planResult.data.content;
    const previousMessages = messagesResult.data || [];

    // Initialize AI model with chat functionality
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{
            text: `You are a learning assistant helping with ${topic}. Here is the learning plan: ${planContent}

IMPORTANT INSTRUCTIONS:
1. Always respond in plain text without any formatting
2. Don't segregate responses into sections
3. Keep responses conversational and natural
4. Don't use any markdown formatting
5. Don't take any formatting examples from the learning plan
6. Stay focused on helping the user learn ${topic}`
          }]
        },
        {
          role: "model",
          parts: [{
            text: "I understand. I'll help you learn about this topic in a conversational way, using plain text without any special formatting or sections. I'll keep the learning plan in mind while we chat."
          }]
        },
        // Add previous messages to history
        ...previousMessages.map(msg => ({
          role: msg.is_ai ? "model" : "user",
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage([{ text: message }]);
    const response = result.response.text();

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
}