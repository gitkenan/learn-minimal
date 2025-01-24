import { initializeSupabase } from '@/lib/supabaseClient';

export const syncService = {
  async updatePlanContent(planId, updateFunction) {
    const supabase = initializeSupabase();
    
    try {
      // Get current plan state with version check
      const { data: currentPlan, error: fetchError } = await supabase
        .from('plans')
        .select('json_content, progress')
        .eq('id', planId)
        .single();
        
      if (fetchError) throw fetchError;
      if (!currentPlan) throw new Error('Plan not found');

      const currentVersion = currentPlan.json_content?.version || 0;

      // Let the update function handle the current state
      const updates = await updateFunction(currentPlan);
      
      // Increment version
      updates.json_content.version = currentVersion + 1;

      // Perform atomic update with version check
      const { error: updateError } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', planId)
        .eq('json_content->version', currentVersion); // Atomic version check

      if (updateError) {
        if (updateError.code === 'P2002') {
          throw new Error('Concurrent modification detected - please try again');
        }
        throw updateError;
      }

      return updates;
    } catch (error) {
      console.error('Plan update error:', error);
      throw error;
    }
  },

  async toggleTaskCompletion(planId, sectionId, itemId) {
    const supabase = initializeSupabase();
    
    try {
      // Get current plan state with version check
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('json_content')
        .eq('id', planId)
        .single();

      if (planError) throw planError;
      if (!planData) throw new Error('Plan not found');

      const currentVersion = planData.json_content?.version || 0;

      // Create updated content without incrementing version yet
      const updatedContent = {
        ...planData.json_content,
        sections: planData.json_content.sections.map(section => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id !== itemId) return item;
              const newIsComplete = !item.isComplete;
              return { ...item, isComplete: newIsComplete };
            })
          };
        })
      };

      // Find the task and get its new completion state
      const targetSection = updatedContent.sections.find(s => s.id === sectionId);
      const targetItem = targetSection?.items.find(i => i.id === itemId);
      
      if (!targetSection || !targetItem) {
        throw new Error('Task not found in plan');
      }

      const newStatus = targetItem.isComplete ? 'completed' : 'pending';

      // Add version for the update
      const updateContent = {
        ...updatedContent,
        version: currentVersion + 1
      };

      // Check for existing calendar task using maybeSingle to handle missing tasks gracefully
      const { data: calendarTask } = await supabase
        .from('calendar_tasks')
        .select('id')
        .eq('plan_id', planId)
        .eq('section_id', sectionId)
        .eq('item_id', itemId)
        .maybeSingle();

      // Begin transaction with only the expected parameters
      const { data, error: transactionError } = await supabase.rpc('sync_task_completion', {
        p_current_version: currentVersion,
        p_item_id: itemId,
        p_json_content: updateContent,
        p_plan_id: planId,
        p_section_id: sectionId,
        p_status: newStatus,
        p_calendar_task_id: calendarTask?.id // Pass calendar task ID if it exists
      });

      if (transactionError) {
        // Handle calendar-not-found as non-critical
        if (transactionError.code === 'P0001') {
          console.warn('Calendar task not updated - no scheduled instance');
          // Still return success since the plan update succeeded
          return { 
            status: newStatus, 
            version: currentVersion + 1 
          };
        }
        
        // Handle concurrent modifications
        if (transactionError.code === 'P2002') {
          throw new Error('Concurrent modification detected - please try again');
        }
        
        // Log and throw other transaction errors
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      // Return the first row of the result (should only be one)
      return data[0] || { 
        status: newStatus,
        version: currentVersion + 1
      };
    } catch (error) {
      // Improve error logging with more context
      console.error('Task synchronization error:', {
        error,
        planId,
        sectionId,
        itemId,
        context: 'toggleTaskCompletion'
      });
      throw error;
    }
  }
};
