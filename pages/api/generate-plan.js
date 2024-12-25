import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Custom error class for better error handling
class PlanGenerationError extends Error {
  constructor(message, type, details = null) {
    super(message);
    this.name = 'PlanGenerationError';
    this.type = type;
    this.details = details;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    // Get the authenticated session from Supabase
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    const { topic, timeline } = req.body;

    // Enhanced input validation
    if (!topic && !timeline) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both topic and timeline are required'
      });
    }
    if (!topic) {
      return res.status(400).json({ 
        error: 'Missing topic',
        message: 'Please provide a topic to learn about'
      });
    }
    if (!timeline) {
      return res.status(400).json({ 
        error: 'Missing timeline',
        message: 'Please specify how much time you have available'
      });
    }

    try {
      // Initialize the model and generate the plan
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Validate that the model was initialized
      if (!model) {
        throw new PlanGenerationError(
          'Failed to initialize AI model',
          'AI_INIT_ERROR'
        );
      }
      
      const prompt = `Create a detailed learning plan for studying: ${topic}. The student has ${timeline} available to learn this topic.

The plan should be structured in markdown format with the following sections:

# Learning Plan for ${topic}

## Phase 1: Fundamentals
[List the basic concepts and foundational knowledge needed, appropriate for the ${timeline} timeframe]

## Phase 2: Deep Dive
[Cover advanced concepts and detailed learning activities that can realistically be achieved within ${timeline}]

## Phase 3: Application
[Include practical applications and hands-on projects scaled to fit within ${timeline}]

## Resources
[List recommended learning resources]

## Timeline
[Break down how to use the ${timeline} effectively, with a recommended study schedule]

Important: Format your response exactly as shown above, using markdown headings (##) for each section. Ensure all content and depth is appropriate for the specified timeframe of ${timeline}.
For each actionable line of the learning plan, start it with a checkbox format [ ] so that the user can
follow the plan step-by-step.
Ensure to follow the most effective practices for effective learning and to avoid distractions. For example, for learning coding languages, the plan should focus on encouraging the user to build a project after they have learned the basics of the language.`;
      
      // Generate the plan with timeout handling
      const generatePromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI generation timed out')), 30000)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      
      if (!result || !result.response) {
        throw new PlanGenerationError(
          'Failed to generate plan content',
          'AI_GENERATION_ERROR'
        );
      }

      const planContent = result.response.text();

      // Validate generated content
      if (!planContent || planContent.trim().length < 50) {
        throw new PlanGenerationError(
          'Generated plan content is too short or empty',
          'INVALID_CONTENT'
        );
      }

      if (!planContent.includes('# Learning Plan')) {
        throw new PlanGenerationError(
          'Generated content does not match expected format',
          'INVALID_FORMAT'
        );
      }

      // Try to insert with regular client first
      const { data: plan, error: insertError } = await supabase
        .from('plans')
        .insert({
          user_id: session.user.id,
          topic,
          content: planContent,
          progress: 0
        })
        .select()
        .single();

      if (!insertError) {
        return res.status(200).json({ plan });
      }

      // If regular insert fails, try with admin client
      console.log('Regular insert failed, trying admin client:', insertError);
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data: servicePlan, error: serviceError } = await supabaseAdmin
        .from('plans')
        .insert({
          user_id: session.user.id,
          topic,
          content: planContent,
          progress: 0
        })
        .select()
        .single();

      if (serviceError) {
        throw new PlanGenerationError(
          'Failed to save plan with admin client',
          'DB_ERROR',
          serviceError
        );
      }

      return res.status(200).json({ plan: servicePlan });
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      // Handle specific database errors
      if (dbError.code === '23505') { // Unique violation
        return res.status(409).json({
          error: 'Duplicate plan',
          message: 'A plan with this topic already exists'
        });
      }
      
      return res.status(500).json({
        error: dbError instanceof PlanGenerationError ? dbError.type : 'DB_ERROR',
        message: dbError.message,
        details: dbError.details || null
      });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    
    // Enhanced error logging for AI generation errors
    if (error.response) {
      console.error('AI Response Error:', {
        status: error.response.status,
        message: error.response.statusText,
        data: error.response.data
      });
    }

    // Return appropriate error response based on error type
    if (error instanceof PlanGenerationError) {
      return res.status(500).json({
        error: error.type,
        message: error.message,
        details: error.details
      });
    }

    // Generic error response for unexpected errors
    return res.status(500).json({
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while generating your plan',
      details: error.message
    });
  }
}