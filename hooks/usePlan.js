// hooks/usePlan.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeSupabase } from '../lib/supabaseClient';
import { parseMarkdownPlan, calculateProgress } from '../components/LearningPlanViewer';

export function usePlan(planId) {
  const { user, session } = useAuth();
  const [plan, setPlan] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch both plan and notes
  const fetchPlanAndNotes = async () => {
    if (!planId || !user) {
      setError('Missing planId or user');
      setLoading(false);
      return;
    }

    try {
      const supabase = initializeSupabase();
      if (!supabase) throw new Error('Failed to initialize Supabase client');

      // Fetch plan and notes in parallel
      const [planResult, notesResult] = await Promise.all([
        supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single(),
        supabase
          .from('plan_item_notes')
          .select('*')
          .eq('plan_id', planId)
          .order('created_at', { ascending: true })
      ]);

      // Handle plan fetch errors
      if (planResult.error) throw planResult.error;
      if (!planResult.data) throw new Error('Plan not found');
      if (planResult.data.user_id !== user.id) throw new Error('Not authorized to access this plan');

      // Handle notes fetch errors
      if (notesResult.error) throw notesResult.error;

      // Group notes by task_id
      const notesByTask = (notesResult.data || []).reduce((acc, note) => {
        if (!acc[note.task_id]) {
          acc[note.task_id] = [];
        }
        acc[note.task_id].push(note);
        return acc;
      }, {});

      setPlan(planResult.data);
      setNotes(notesByTask);
      setError(null);
    } catch (err) {
      console.error('Error fetching plan and notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPlanAndNotes();
  }, [planId, user?.id]);

  // Update plan content with concurrency handling
  const updatePlan = async (updateFunction) => {
    if (!session || !plan) return;
    
    setUpdating(true);
    try {
      const supabase = initializeSupabase();
      
      // First get the latest version to check for conflicts
      const { data: currentPlan, error: fetchError } = await supabase
        .from('plans')
        .select('json_content, progress')
        .eq('id', planId)
        .single();
        
      if (fetchError) throw fetchError;

      // Let the update function handle the current state
      const updates = await updateFunction(currentPlan);
      
      // Handle version conflicts
      if (currentPlan.json_content?.version !== plan.json_content?.version) {
        console.warn('Detected concurrent update, merging changes');
        // Merge changes by preserving structure but updating completion states
        const mergedContent = {
          ...currentPlan.json_content,
          sections: currentPlan.json_content.sections.map(section => ({
            ...section,
            items: section.items.map(item => {
              const updatedItem = updates.json_content.sections
                .find(s => s.id === section.id)?.items
                .find(i => i.id === item.id);
              return updatedItem || item;
            })
          }))
        };
        updates.json_content = mergedContent;
      }

      // Increment version
      const newVersion = (currentPlan.json_content?.version || 0) + 1;
      updates.json_content.version = newVersion;

      const { error: updateError } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', planId);

      if (updateError) throw updateError;

      // Refresh plan data after update
      await fetchPlanAndNotes();
    } catch (err) {
      console.error('Failed to update plan:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  // Handle note operations
  const saveNote = async (taskId, content) => {
    if (!session || !plan) return;

    try {
      const supabase = initializeSupabase();
      
      const { data: newNote, error } = await supabase
        .from('plan_item_notes')
        .insert({
          plan_id: planId,
          task_id: taskId,
          content
        })
        .select()
        .single();

      if (error) throw error;

      // Update local notes state
      setNotes(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), newNote]
      }));

      return newNote;
    } catch (error) {
      console.error('Error saving note:', error);
      setError(error.message);
      throw error;
    }
  };

  // Delete note
  const deleteNote = async (noteId) => {
    if (!session || !plan) return;

    try {
      const supabase = initializeSupabase();
      
      const { error } = await supabase
        .from('plan_item_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Update local notes state
      setNotes(prev => {
        const newNotes = { ...prev };
        // Find and remove the note from the appropriate task
        Object.keys(newNotes).forEach(taskId => {
          newNotes[taskId] = newNotes[taskId].filter(note => note.id !== noteId);
          // Remove the task key if it has no more notes
          if (newNotes[taskId].length === 0) {
            delete newNotes[taskId];
          }
        });
        return newNotes;
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      setError(error.message);
      throw error;
    }
  };

  // Toggle task completion
  const toggleTask = async (sectionId, itemId) => {
    await updatePlan((currentPlan) => {
      let newContent = {
        ...currentPlan.json_content,
        sections: currentPlan.json_content.sections.map(section => {
          if (section.id !== sectionId) return section;
          
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id !== itemId) return item;
              return { ...item, isComplete: !item.isComplete };
            })
          };
        })
      };

      // Calculate new progress
      const newProgress = calculateProgress(newContent.sections);

      return {
        json_content: newContent,
        progress: newProgress
      };
    });
  };

  return {
    plan,
    notes,
    loading,
    error,
    updating,
    toggleTask,
    saveNote,
    deleteNote,
    updatePlan,
    refresh: fetchPlanAndNotes
  };
}
