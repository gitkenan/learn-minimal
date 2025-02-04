// pages/api/chat.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleApiError } from '../../utils/apiUtils';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return handleApiError(res, {
      statusCode: 405,
      type: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed'
    }, 'Method not allowed');
  }

  // Declare variables outside try block for error handling
  let message, topic, discussionId, planId;
  
  try {
    // Get the authenticated session
    const supabase = createPagesServerClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized', details: sessionError?.message });
    }

    ({ message, topic, discussionId, planId } = req.body);

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

    // Extract timeline info from plan content
    const timelineMatch = planContent.match(/Timeline:([\s\S]*?)(?:\n\n|$)/i);
    const timelineInfo = timelineMatch ? timelineMatch[1].trim() : 'No specific timeline provided';

    // Initialize AI model with chat functionality
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_CIVIC_INTEGRITY",
          threshold: "BLOCK_NONE"
        }
      ]
    });

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
   
   Here is the learning plan content:
   ${planContent}
   
   Let's have a productive conversation!`
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
    
    if (!result || !result.response) {
      console.error('Invalid AI response format:', result);
      return res.status(502).json({ 
        error: 'Invalid AI response format',
        details: 'The AI returned an invalid response format',
        code: 'AI_RESPONSE_FORMAT_ERROR'
      });
    }

    const responseText = result.response.text();
    if (!responseText || typeof responseText !== 'string') {
      console.error('Empty or invalid AI response:', responseText);
      return res.status(502).json({ 
        error: 'Empty or invalid AI response',
        details: 'The AI returned an empty or invalid response',
        code: 'AI_RESPONSE_CONTENT_ERROR'
      });
    }

    return res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('Chat API error:', {
      message: error.message,
      stack: error.stack,
      request: {
        message,
        topic,
        discussionId,
        planId
      }
    });
    
    if (error.message.includes('SAFETY')) {
      return handleApiError(res, {
        statusCode: 403,
        type: 'CONTENT_SAFETY_ERROR',
        message: 'Message blocked by content safety filters',
        code: 'CONTENT_SAFETY_ERROR'
      }, 'Content safety error');
    }

    return handleApiError(res, error, 'Failed to process chat message');
  }
}
