import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validatePlanStructure } from '../../utils/flexiblePlanValidator';
import { parseMarkdownPlan } from '../../components/MarkdownPlan';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

class PlanGenerationError extends Error {
  constructor(message, type, details = null) {
    super(message);
    this.name = 'PlanGenerationError';
    this.type = type;
    this.details = details;
  }
}

const DEBUG_MODE = process.env.NODE_ENV !== 'production';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    const { topic, experience, timeline } = req.body;

    // Check all required fields
    if (!topic || !experience || !timeline) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide topic, experience level, and timeline'
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      if (!model) {
        throw new PlanGenerationError('Failed to initialize AI model', 'AI_INIT_ERROR');
      }

      // Revised prompt that uses 'experience' to tailor the plan
      const prompt = `
        You are an expert educator creating a personalized learning plan for someone interested in: ${topic}.
        The learner has described their experience level as: ${experience}.
        They have ${timeline} available to learn.

        First, generate a clear, concise title for this learning plan.
        Then, create the detailed plan following this format:

        # {The generated title}

        IMPORTANT CONTEXT:
            1. Tailor the plan to both the topic's nature and the learner's background.
            2. Some topics benefit from hands-on learning from the start, while others need theoretical foundations.
            3. The plan structure should reflect what works best for this specific topic and learner 
               (not necessarily "fundamentals → deep dive → application" unless it truly fits).
            4. Use markdown headings (##) to keep content organized, but feel free to choose how many 
               sections or phases make sense.
            5. For any recommended tasks (except the timeline), prepend each line with [ ] for checkboxes.
            6. Provide a concise "Timeline" section (with no checkboxes) that offers scheduling guidance 
               based on the learner's background.
            7. Include a "Resources" section if relevant, with checkboxes ([ ]) for each resource.

        FORMATTING REQUIREMENTS:
            - The title should be professional and clearly indicate the subject matter
            - Use markdown formatting like **bold** and *italics* for emphasis
            - Each task should start with [ ] for checkboxes
            - The Timeline section should not have checkboxes
            - Use descriptive section titles that reflect the content
            - Keep paragraphs concise and well-structured

        GOALS:
            - The plan should be thorough, referencing proven strategies if you are certain of their accuracy
            - Avoid repetitive tasks or phrasing
            - Reflect the learner's experience: advanced learners may skip basics or jump into practice
            - The final output must be valid markdown and contain checkboxes ([ ]) in appropriate sections, 
              but not the timeline section
            - Keep the "Timeline" section to a single sentence or short paragraph

        Please generate the plan now.`.trim();

      const generatePromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out')), 30000)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      if (!result || !result.response) {
        throw new PlanGenerationError('Failed to generate plan content', 'AI_GENERATION_ERROR');
      }

      let planContent = result.response.text();

      // Basic validation
      const validation = validatePlanStructure(planContent);
      if (!validation.isValid) {
        // Optional: retry once with a simplified prompt
        const retryPrompt = `${prompt}\n\nPrevious attempt was missing required structure or tasks. Please ensure:
          1) At least some markdown headings (# or ##)
          2) At least 3 total checkbox tasks ([ ])
          3) A concise timeline section with no checkboxes.
        `;
        const retryResult = await model.generateContent(retryPrompt);
        const retryContent = retryResult.response.text();
        const retryValidation = validatePlanStructure(retryContent);

        if (!retryValidation.isValid) {
          throw new PlanGenerationError(
            'Generated content failed validation after retry',
            'INVALID_CONTENT',
            { errors: retryValidation.errors, stats: retryValidation.stats }
          );
        }
        planContent = retryContent;
      }

      // Parse the markdown to JSON structure before saving
      const parsedPlan = parseMarkdownPlan(planContent);

      // Try to store both formats, but don't fail if json_content column doesn't exist yet
      const planData = {
        user_id: session.user.id,
        topic,
        experience,
        timeline,
        content: planContent,           // Keep original markdown
        progress: 0,
        validation_result: validation   // Store validation results
      };

      try {
        // First attempt without json_content
        const { data: plan, error: insertError } = await supabase
          .from('plans')
          .insert(planData)
          .select()
          .single();

        if (!insertError) {
          // If successful, try to update with json_content
          const { error: updateError } = await supabase
            .from('plans')
            .update({ json_content: parsedPlan })
            .eq('id', plan.id);
            
          // Even if update fails, return the plan
          return res.status(200).json({ plan });
        }
        throw insertError;
      } catch (error) {
        // If the first insert failed, try without json_content column
        console.error('Initial insert failed:', error);

        // Insert plan into database
        const { data: plan, error: insertError } = await supabase
          .from('plans')
          .insert({
            user_id: session.user.id,
            topic,
            experience,
            timeline,
            content: planContent,           // Keep original markdown
            progress: 0,
            validation_result: validation   // Store validation results
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return res.status(200).json({ plan });
      }
    } catch (dbError) {
      if (dbError.code === '23505') {
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
    if (error instanceof PlanGenerationError) {
      return res.status(500).json({
        error: error.type,
        message: error.message,
        details: error.details
      });
    }
    return res.status(500).json({
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred while generating your plan',
      details: error.message
    });
  }
}