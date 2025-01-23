// hooks/usePlan.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeSupabase } from '../lib/supabaseClient';
import { syncService } from '@/lib/syncService';
import { calculateProgress } from '../utils/planParserUtils';

export function usePlan(planId) {
  const { user, session } = useAuth();
  const [plan, setPlan] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Single fetch function
  const fetchPlanAndNotes = useCallback(async () => {
    // Handle missing planId/user early but maintain hook shape
    if (!planId || !user) {
      setPlan(null);
      setNotes({});
      setError('No planId or user');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = initializeSupabase();
      if (!supabase) throw new Error('Failed to initialize Supabase client');

      // Parallel fetch: plan + notes
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

      // Check errors
      if (planResult.error) throw planResult.error;
      if (!planResult.data) throw new Error('Plan not found');
      if (planResult.data.user_id !== user.id) {
        throw new Error('Not authorized to access this plan');
      }
      if (notesResult.error) throw notesResult.error;

      // Group notes by task_id
      const notesByTask = {};
      for (const note of notesResult.data || []) {
        if (!notesByTask[note.task_id]) notesByTask[note.task_id] = [];
        notesByTask[note.task_id].push(note);
      }

      setPlan(planResult.data);
      setNotes(notesByTask);
    } catch (err) {
      console.error('Error fetching plan and notes:', err);
      setError(err.message);
      setPlan(null);
      setNotes({});
    } finally {
      setLoading(false);
    }
  }, [planId, user]);

  // Single effect that calls fetch
  useEffect(() => {
    // If planId or user changes from undefined to valid, do fetch
    fetchPlanAndNotes();
  }, [fetchPlanAndNotes]);

  // The updatePlan function
  const updatePlan = async (updateFunction) => {
    if (!session || !plan) return;

    setUpdating(true);
    try {
      await syncService.updatePlanContent(planId, updateFunction);
      // Re-fetch to get updated
      await fetchPlanAndNotes();
    } catch (err) {
      console.error('Failed to update plan:', err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Save note
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

      setNotes((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), newNote]
      }));
      return newNote;
    } catch (err) {
      console.error('Error saving note:', err);
      setError(err.message);
      throw err;
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

      setNotes((prev) => {
        const newNotes = { ...prev };
        Object.keys(newNotes).forEach((taskId) => {
          newNotes[taskId] = newNotes[taskId].filter((n) => n.id !== noteId);
          if (!newNotes[taskId].length) {
            delete newNotes[taskId];
          }
        });
        return newNotes;
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err.message);
      throw err;
    }
  };

  // Toggle task
  const toggleTask = async (sectionId, itemId) => {
    if (!plan) return;
    try {
      await syncService.toggleTaskCompletion(planId, sectionId, itemId);
      // Re-fetch plan
      await fetchPlanAndNotes();
    } catch (err) {
      console.error('Failed to toggle task:', err);
      throw err;
    }
  };

  // Expose everything consistently
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
