import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

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

    const planContent = `# Learning Plan for ${topic}

## Phase 1: Fundamentals
* Understand basic concepts of ${topic}
* Research key terminology
* Identify primary resources for learning

## Phase 2: Deep Dive
* Study advanced concepts
* Practice with exercises
* Review and summarize learnings

## Phase 3: Application
* Work on a small project
* Document your progress
* Share your knowledge

## Resources
* Online courses
* Books and documentation
* Community forums
* Practice exercises

## Timeline
Estimated completion time: 4-6 weeks
Regular practice recommended: 1-2 hours daily`;

    try {
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
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}