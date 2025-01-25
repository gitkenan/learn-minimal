// hooks/usePlan.js
import { useState, useEffect, useCallback, useReducer } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeSupabase } from '../lib/supabaseClient';
import { syncService } from '@/lib/syncService';
import { calculateProgress } from '../utils/planParserUtils';

// Singleton Supabase client
const supabase = initializeSupabase();

// Error classification
const isRecoverableError = (error) => {
  if (!error) return false;
  const code = error.code?.toString() || error.status?.toString();
  return code?.startsWith('40') || code?.startsWith('50');
};

// State reducer for complex updates
const planReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAN':
      return { ...state, plan: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'ADD_NOTE':
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.payload.task_id]: [
            ...(state.notes[action.payload.task_id] || []),
            action.payload
          ]
        }
      };
    case 'DELETE_NOTE':
      const newNotes = { ...state.notes };
      Object.keys(newNotes).forEach((taskId) => {
        newNotes[taskId] = newNotes[taskId].filter(
          (n) => n.id !== action.payload
        );
        if (!newNotes[taskId].length) delete newNotes[taskId];
      });
      return { ...state, notes: newNotes };
    case 'OPTIMISTIC_TOGGLE':
      return {
        ...state,
        plan: {
          ...state.plan,
          json_content: {
            ...state.plan.json_content,
            version: action.payload.version
          }
        }
      };
    default:
      return state;
  }
};

export function usePlan(planId) {
  const { user, session } = useAuth();
  const [{ plan, notes }, dispatch] = useReducer(planReducer, {
    plan: null,
    notes: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Setup real-time subscription with error handling
  useEffect(() => {
    let mounted = true;
    let channel;

    const setupSubscription = async () => {
      if (!planId || !user || !mounted) return;

      try {
        channel = supabase.channel(`plan-${planId}`);
        
        // Handle subscription errors
        channel.on('error', (error) => {
          console.error('Subscription error:', error);
          if (mounted && !isRecoverableError(error)) {
            setError('Real-time sync error: ' + error.message);
          }
        });

        // Subscribe to plan changes
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'plans',
            filter: `id=eq.${planId}`
          },
          () => mounted && fetchPlanAndNotes()
        );

        // Subscribe to notes changes
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'plan_item_notes',
            filter: `plan_id=eq.${planId}`
          },
          () => mounted && fetchPlanAndNotes()
        );

        await channel.subscribe();
      } catch (err) {
        console.error('Failed to setup subscription:', err);
        if (mounted && !isRecoverableError(err)) {
          setError('Failed to setup real-time sync: ' + err.message);
        }
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch(console.error);
      }
    };
  }, [planId, user]);

  // Enhanced fetch function with error recovery
  const fetchPlanAndNotes = useCallback(async () => {
    // Handle missing planId/user early but maintain hook shape
    if (!planId || !user) {
      dispatch({ type: 'SET_PLAN', payload: null });
      dispatch({ type: 'SET_NOTES', payload: {} });
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
      if (planResult.error) {
        const recoverable = isRecoverableError(planResult.error);
        if (!recoverable) {
          dispatch({ type: 'SET_PLAN', payload: null });
          dispatch({ type: 'SET_NOTES', payload: {} });
        }
        throw planResult.error;
      }
      if (!planResult.data) {
        dispatch({ type: 'SET_PLAN', payload: null });
        dispatch({ type: 'SET_NOTES', payload: {} });
        throw new Error('Plan not found');
      }
      if (planResult.data.user_id !== user.id) {
        dispatch({ type: 'SET_PLAN', payload: null });
        dispatch({ type: 'SET_NOTES', payload: {} });
        throw new Error('Not authorized to access this plan');
      }
      if (notesResult.error) {
        if (!isRecoverableError(notesResult.error)) {
          dispatch({ type: 'SET_NOTES', payload: {} });
        }
        throw notesResult.error;
      }

      // Group notes by task_id
      const notesByTask = {};
      for (const note of notesResult.data || []) {
        if (!notesByTask[note.task_id]) notesByTask[note.task_id] = [];
        notesByTask[note.task_id].push(note);
      }

      dispatch({ type: 'SET_PLAN', payload: planResult.data });
      dispatch({ type: 'SET_NOTES', payload: notesByTask });
    } catch (err) {
      console.error('Error fetching plan and notes:', err);
      const recoverable = isRecoverableError(err);
      setError(`${err.message}${recoverable ? ' (retrying...)' : ''}`);
      
      if (!recoverable) {
        dispatch({ type: 'SET_PLAN', payload: null });
        dispatch({ type: 'SET_NOTES', payload: {} });
      }
      
      // If error is recoverable, retry after a delay
      if (recoverable) {
        setTimeout(() => {
          fetchPlanAndNotes();
        }, 5000);
      }
    } finally {
      setLoading(false);
    }
  }, [planId, user]);

  // Enhanced effect with cleanup
  useEffect(() => {
    let mounted = true;
    let retryTimeout;

    const fetchData = async () => {
      if (!mounted) return;
      
      if (planId && user?.id) {
        await fetchPlanAndNotes();
      } else {
        dispatch({ type: 'SET_PLAN', payload: null });
        dispatch({ type: 'SET_NOTES', payload: {} });
        setError(planId ? 'No authenticated user' : 'No plan selected');
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      dispatch({ type: 'SET_PLAN', payload: null });
      dispatch({ type: 'SET_NOTES', payload: {} });
    };
  }, [planId, user?.id]); // Use primitive values in dependencies

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

      dispatch({
        type: 'ADD_NOTE',
        payload: newNote
      });
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

      dispatch({
        type: 'DELETE_NOTE',
        payload: noteId
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
      const result = await syncService.toggleTaskCompletion(planId, sectionId, itemId);
      // Update local state with the new version
      dispatch({
        type: 'OPTIMISTIC_TOGGLE',
        payload: { version: result.version }
      });
      return result;
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
