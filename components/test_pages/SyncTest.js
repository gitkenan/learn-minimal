import { useState, useEffect } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { initializeSupabase } from '@/lib/supabaseClient';
import { toast } from 'react-toastify';

const SyncTest = ({ planId, sectionId, itemId }) => {
  const [planStatus, setPlanStatus] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState(null);
  const [versionsMatch, setVersionsMatch] = useState(false);
  const { toggleTask, plan } = usePlan(planId);

  const refreshStatus = async () => {
    const supabase = initializeSupabase();
    
    // Get plan item status
    const planItem = plan?.json_content?.sections
      ?.find(s => s.id === sectionId)?.items
      ?.find(i => i.id === itemId);
    setPlanStatus(planItem?.isComplete ? 'completed' : 'pending');

    // Get calendar task status
    const { data: calendarTask } = await supabase
      .from('calendar_tasks')
      .select('status')
      .eq('plan_id', planId)
      .eq('section_id', sectionId)
      .eq('item_id', itemId)
      .single();
      
    setCalendarStatus(calendarTask?.status || 'unknown');
  };

  const handleToggle = async (source) => {
    try {
      if (source === 'plan') {
        await toggleTask(sectionId, itemId);
      } else {
        const supabase = initializeSupabase();
        const { data: task } = await supabase
          .from('calendar_tasks')
          .select('status')
          .eq('plan_id', planId)
          .eq('section_id', sectionId)
          .eq('item_id', itemId)
          .single();

        await supabase
          .from('calendar_tasks')
          .update({ status: task.status === 'completed' ? 'pending' : 'completed' })
          .eq('plan_id', planId)
          .eq('section_id', sectionId)
          .eq('item_id', itemId);
      }

      await refreshStatus();
      toast.success(`Toggled from ${source} - checking sync...`);
      
      // Verify versions
      const supabase = initializeSupabase();
      const { data: planData } = await supabase
        .from('plans')
        .select('json_content->version')
        .eq('id', planId)
        .single();

      const { data: calendarData } = await supabase
        .from('calendar_tasks')
        .select('updated_at')
        .eq('plan_id', planId)
        .eq('section_id', sectionId)
        .eq('item_id', itemId)
        .single();

      setVersionsMatch(
        planData.json_content.version.toString() === 
        calendarData.updated_at
      );
      
    } catch (error) {
      toast.error(`Sync error: ${error.message}`);
      console.error('Sync test failed:', error);
    }
  };

  useEffect(() => {
    if (planId && sectionId && itemId) {
      refreshStatus();
    }
  }, [planId, sectionId, itemId]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Sync Test Component</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => handleToggle('plan')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle via Plan
          </button>
          
          <button
            onClick={() => handleToggle('calendar')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Toggle via Calendar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Plan Status</h3>
            <p className={planStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
              {planStatus || 'Loading...'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Calendar Status</h3>
            <p className={calendarStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
              {calendarStatus || 'Loading...'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Version Consistency</h3>
          <p className={versionsMatch ? 'text-green-600' : 'text-red-600'}>
            {versionsMatch ? 'In Sync' : 'Out of Sync'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyncTest;