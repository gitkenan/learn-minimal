// pages/api/exam-endpoint.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'This endpoint only accepts POST requests' 
    });
  }

  try {
    // Ensure user is signed in
    const supabase = createPagesServerClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Pull data from request body
    const { prompt, messages } = req.body;
    if (!prompt || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Missing or invalid fields',
        message: 'Please provide a "prompt" and an array of "messages".',
      });
    }

    // Initialize Google GenAI client
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Convert messages to chat history. 
    // *No longer require the first message to be user; some apps start with an AI introduction or system message.
    const history = messages.map((m) => ({
      role: m.isAI ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    // Generate content with full history
    const result = await model.generateContent({
      contents: [
        ...history.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.parts[0].text }],
        })),
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    if (!result || !result.response) {
      return res.status(502).json({
        error: 'Invalid AI response format',
        message: 'The AI returned no usable response.',
      });
    }

    // Extract and return text response
    const responseText = result.response.text();
    return res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('Exam Endpoint Error:', error);
    return res.status(500).json({
      error: 'UNKNOWN_ERROR',
      message: 'Failed to process your request.',
      details: error.message,
    });
  }
}
