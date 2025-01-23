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

      // Begin transaction
      const { error: transactionError } = await supabase.rpc('sync_task_completion', {
        p_plan_id: planId,
        p_section_id: sectionId,
        p_item_id: itemId,
        p_json_content: updateContent,
        p_status: newStatus,
        p_current_version: currentVersion
      });

      if (transactionError) {
        if (transactionError.code === 'P2002') {
          throw new Error('Concurrent modification detected - please try again');
        }
        throw transactionError;
      }

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
