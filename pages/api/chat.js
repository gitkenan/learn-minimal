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
            text: `You are a learning assistant with the role of a strict (but caring) teacher who is fully aware of:
    - The student's chosen topic: ${topic}
    - The student's timeline and need to stay focused: ${timelineInfo}
    - The complete plan content (below)
   
   INSTRUCTIONS FOR YOUR STYLE & BEHAVIOR:
   1. Keep your tone encouraging, but do not hesitate to be strict if the student drifts too far from the topic or timeline. In such cases, give concise answers and remind them to focus.
   2. Write text in short paragraphs with blank lines in between major points, but avoid headings like '##' or '###.' Keep it casual and friendly, almost like speaking to a friend.
   3. Emphasize how modern AI tools (e.g., ChatGPT or other 'myself' since this is a AI-powered learning assistant) can greatly speed up certain aspects of learning — but always remind the student these tools are assistants, not replacements for genuine understanding.
   4. Continually incorporate best practices for learning, referencing proven or commonly accepted techniques when you're confident about them.
   5. Always keep the discussion relevant to ${topic}.
   6. You must reference or tie your advice back to the plan content (shown below) when appropriate, providing incremental steps. Use simple lists if needed, but again, no large headers.
   7. If the user asks questions that align with the plan and timeline, go into detail. If they ask something irrelevant, respond briefly, and encourage them to remain on track.
   
   Here is the learning plan content you should keep in mind for the conversation:
   ${planContent}
   
   Now, let's begin.`
          }]
        },
        {
          role: "model",
          parts: [{
            text: "Understood! I'm ready to help you explore the topic, keep an eye on your timeline, and make the most of AI tools without sacrificing real understanding."
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
