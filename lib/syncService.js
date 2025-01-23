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

      // Handle version conflicts by merging changes
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
        }),
        version: currentVersion + 1
      };

      // Determine new status based on the updated content
      const newStatus = updatedContent.sections
        .find(s => s.id === sectionId)?.items
        .find(i => i.id === itemId)?.isComplete ? 'completed' : 'pending';

      // Perform atomic updates with version check
      const { error: updateError } = await supabase
        .from('plans')
        .update({ 
          json_content: updatedContent,
        })
        .eq('id', planId)
        .eq('json_content->version', currentVersion); // Atomic version check

      if (updateError) {
        if (updateError.code === 'P2002') {
          throw new Error('Concurrent modification detected - please try again');
        }
        throw updateError;
      }

      // Update calendar task status
      const { error: calendarError } = await supabase
        .from('calendar_tasks')
        .update({ status: newStatus })
        .eq('plan_id', planId)
        .eq('section_id', sectionId)
        .eq('item_id', itemId);

      if (calendarError) throw calendarError;

      return { 
        newStatus,
        newVersion: currentVersion + 1
      };
    } catch (error) {
      console.error('Synchronization error:', error);
      throw error;
    }
  }
};
