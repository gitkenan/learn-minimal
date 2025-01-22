import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });

    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { plan_id, section_id, item_id, content, date } = req.body;
    const missingFields = [];
    if (!plan_id) missingFields.push('plan_id');
    if (!content) missingFields.push('content');
    if (!date) missingFields.push('date');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_FIELDS'
      });
    }

    // Validate and format date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format - use ISO 8601 format',
        code: 'INVALID_DATE'
      });
    }
    const dbDate = dateObj.toISOString().split('T')[0]; // Store as DATE type

    // Insert task with explicit field mapping
    const { data, error } = await supabase
      .from('calendar_tasks')
      .insert({
        user_id: user.id,
        plan_id,
        section_id: section_id || null,
        item_id: item_id || null,
        content,
        date: dbDate,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('*')
      .single(); // Use single() instead of maybeSingle()

    if (error) {
      console.error('Calendar task creation failed:', {
        error,
        body: req.body,
        user: user.id,
        supabaseError: error
      });
      
      // Handle unique constraint violation specifically
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Task already exists for this plan item on this date',
          code: error.code,
          details: error.details,
          hint: 'Edit existing task instead of creating new one'
        });
      }

      return res.status(500).json({
        error: 'Failed to create calendar task',
        code: error.code,
        details: error.details,
        hint: error.hint || null
      });
    }

    if (!data) {
      throw new Error('No data returned from insert operation');
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error adding calendar task:', {
      error: error,
      stack: error.stack,
      body: req.body,
      user: user?.id
    });
    
    return res.status(500).json({
      error: error.message || 'Failed to add calendar task',
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || 'Check server logs for details'
    });
  }
}
