import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authenticated session from Supabase
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    try {
      // Define the learning plan prompt template
      const PLAN_PROMPT = `Create a detailed learning plan for studying: ${topic}.
        The plan should be structured in markdown format with the following sections:

        # Learning Plan for ${topic}

        ## Phase 1: Fundamentals
        [List the basic concepts and foundational knowledge needed]

        ## Phase 2: Deep Dive
        [Cover advanced concepts and detailed learning activities]

        ## Phase 3: Application
        [Include practical applications and hands-on projects]

        ## Resources
        [List recommended learning resources]

        ## Timeline
        [Provide estimated completion time and recommended study schedule]

        Important: Format your response exactly as shown above, using markdown headings (##) for each section,
        and using checkboxes [ ] for each learning activity.`;
      // Initialize the model and generate the plan
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const prompt = PLAN_PROMPT.replace(/\${topic}/g, topic);

      const result = await model.generateContent(prompt);
      const planContent = result.response.text();

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
        throw serviceError;
      }

      return res.status(200).json({ plan: servicePlan });
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return res.status(500).json({
        error: 'Failed to save plan',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    // Enhanced error logging for AI generation errors
    if (error.response) {
      console.error('AI Response Error:', error.response);
    }
    return res.status(500).json({
      error: 'Failed to generate plan',
      details: error.message
    });
  }
}