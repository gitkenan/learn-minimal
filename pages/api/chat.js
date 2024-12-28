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

    // Verify discussion belongs to user and get plan content
    const [discussionResult, planResult] = await Promise.all([
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
        .single()
    ]);

    if (!discussionResult.data || !planResult.data) {
      return res.status(403).json({ error: 'Not authorized to access this content' });
    }

    const planContent = planResult.data.content;

    // Initialize AI model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Enhanced prompt with plan context and accuracy requirements
    const prompt = `You are a knowledgeable and encouraging learning assistant helping someone understand ${topic}. You have access to their learning plan, which is provided below.

LEARNING PLAN CONTEXT:
${planContent}

CHAT HISTORY CONTEXT:
The user is actively working through this learning plan and has a question.

THEIR QUESTION:
${message}

RESPONSE REQUIREMENTS:
1. Directly address their question while considering where they are in their learning journey based on the plan.
2. If relevant, reference specific parts of their learning plan to help connect concepts.
3. Include practical examples that align with their learning goals.
4. If you mention any facts, statistics, specific tools, resources, or quote anyone:
   - ONLY include information you are 100% certain is accurate
   - If you're not entirely sure about a specific detail, explain the concept without citing specific facts
   - Never make up or guess at statistics, quotes, or specific resource details
5. When suggesting resources:
   - Only recommend widely-known, verified resources
   - Avoid mentioning specific URLs unless you're absolutely certain they're correct
   - Focus on describing what makes a good resource rather than naming specific ones if you're unsure
6. Encourage exploration while staying within the scope of their learning plan

FORMAT YOUR RESPONSE:
- Be clear and concise while being thorough
- Use examples when helpful
- If relevant, indicate which phase of their learning plan this connects to
- End with a thought-provoking question or suggestion that encourages deeper exploration of the topic`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
}