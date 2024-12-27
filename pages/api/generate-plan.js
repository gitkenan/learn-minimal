import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validatePlanStructure } from '../../utils/planValidator';

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

      const prompt = `
      You are an expert educator creating a comprehensive, cutting-edge learning plan on the topic: ${topic} 
      The learner has a timeline of: ${timeline} available. Please generate a markdown-formatted plan with 
      checkboxes for each actionable item.
      
      Goals:
      
          The plan must be thorough and in-depth, drawing on current, research-backed methods and examples 
          from leading professionals in the field.
          It should include a variety of tasks, avoiding repetitive topics, while truly leveraging the 
          ${timeline} constraints.
          The final output must be easy to format:
              Use markdown headings:
                  # Learning Plan for ${topic}
                  ## Phase 1: Fundamentals
                  ## Phase 2: Deep Dive
                  ## Phase 3: Application
                  ## Resources
                  ## Timeline
              For each actionable step in the plan, include a checkbox at the beginning of the line ([ ]).
              Also include these checkboxes for the items in the Resources section: ([ ]), but not the Timeline section. 
          Under Timeline, provide only one concise sentence describing how to strategize or structure the schedule.
      
      Plan Requirements:
      
          Phase 1: Fundamentals
              Introduce advanced yet foundational knowledge—mention practical methods used by top experts 
              or institutions.
              Provide tasks that are distinct from each other (avoid repeating the same phrasing).
          Phase 2: Deep Dive
              Explore specialized or advanced aspects of the topic, referencing real-world applications 
              or thought leaders to keep it cutting-edge.
              Maintain variety in each recommended activity.
          Phase 3: Application
              Emphasize hands-on projects or real-life practice to solidify learning in line with the 
              given ${timeline}.
              Cite proven approaches from leading professionals if possible, and only if you're 100% certain 
              about the accuracy of the citation.
          Resources
              List recommended books, articles, courses, or other media from recognized authorities if relevant.
              Only provide a link if you're certain that it's a real link and not a fake one.
          Timeline
              In one sentence, give an overview of how to break down the entire ${timeline} efficiently 
              without repeating earlier instructions.
      
      Important:
      
          Always keep each bullet point or sub-task unique; avoid repetitive wording across tasks.
          Reflect the learner's total available time ${timeline} across the whole plan. 
          Prioritize tasks that are most relevant to the learner's goals and timeline.
          The final response must be in valid markdown with properly formatted checkboxes.`;     
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

      // Validate the generated content
      const validation = validatePlanStructure(planContent);
      
      if (!validation.isValid) {
        console.error('Plan validation failed:', {
          errors: validation.errors,
          stats: validation.stats
        });
        
        // If validation fails, try one more time
        const retryResult = await model.generateContent(prompt);
        const retryContent = retryResult.response.text();
        const retryValidation = validatePlanStructure(retryContent);
        
        if (!retryValidation.isValid) {
          throw new PlanGenerationError(
            'Generated content failed validation after retry',
            'INVALID_CONTENT',
            {
              errors: validation.errors,
              stats: validation.stats
            }
          );
        }
        
        // Use the valid retry content
        planContent = retryContent;
      }

      // Log any warnings for monitoring
      if (validation.warnings.length > 0) {
        console.warn('Plan generation warnings:', {
          warnings: validation.warnings,
          topic,
          stats: validation.stats
        });
      }

      // Additional logging for monitoring prompt effectiveness
      console.info('Plan generation stats:', {
        topic,
        timeline,
        contentLength: validation.stats.contentLength,
        totalCheckboxItems: validation.stats.totalCheckboxItems,
        sectionLengths: validation.stats.sectionLengths
      });

      // Basic validation checks
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