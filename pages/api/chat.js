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
1. Keep responses conversational and natural
2. Add proper spacing between paragraphs using blank lines
3. Don't use headers, sections, or special formatting
4. Use simple lists when needed, but keep them natural
5. Stay focused on helping the user learn ${topic}
6. Maintain a friendly, casual tone
7. Use metaphors to explain complex concepts
8. Encourage them by boosting their confidence when they're genuinely doing a good job
9. Take the personality of a professional teacher who is strict, but in a helpful way.`
          }]
        },
        {
          role: "model",
          parts: [{
            text: "I understand. I'll help you learn about this topic in a conversational way, making sure to use proper spacing between paragraphs while keeping things natural and easy to read."
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