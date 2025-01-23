import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { useAuth } from '@/context/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { initializeSupabase } from '@/lib/supabaseClient';
import { FaCheck, FaTimes } from 'react-icons/fa';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get plan functions and state when we have a selected task with a planId
  const { toggleTask: planToggleTask, refresh: refreshPlan, plan } = usePlan(selectedTask?.planId || null);
  
  // Memoize the task toggle function
  const toggleTask = useCallback(() => {
    if (!selectedTask?.planId) {
      throw new Error('Cannot toggle task without a valid planId');
    }
    return planToggleTask(selectedTask.sectionId, selectedTask.itemId);
  }, [selectedTask, planToggleTask]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const supabase = initializeSupabase();

      const { data: calendarTasks, error: tasksError } = await supabase
        .from('calendar_tasks')
        .select(`
          *,
          plans:plan_id (topic)
        `)
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      setTasks(calendarTasks.map(task => ({
        id: task.id,
        title: task.content,
        start: new Date(task.date),
        end: new Date(task.date),
        planId: task.plan_id,
        sectionId: task.section_id,
        itemId: task.item_id,
        status: task.status,
        planName: task.plans?.topic,
        allDay: true,
      })));
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load calendar tasks');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id, fetchTasks]);

  // Refresh tasks when selected task status changes or when plan is refreshed
  useEffect(() => {
    if (selectedTask?.status || plan?.json_content?.version) {
      fetchTasks();
    }
  }, [selectedTask?.status, plan?.json_content?.version, fetchTasks]);

  const handleTaskClick = useCallback((event) => {
    setSelectedTask(event);
  }, []);

  const handleMarkComplete = async () => {
    if (!selectedTask) return;

    try {
      setError('');
      
      // First update the plan through the sync service
      await toggleTask();
      
      // Then refresh both plan and tasks
      await Promise.all([
        refreshPlan(),
        fetchTasks()
      ]);
      
      // Close the modal after successful update
      setSelectedTask(null);
    } catch (err) {
      console.error('Error marking task complete:', err);
      setError('Failed to update task status');
    }
  };

  const eventStyleGetter = useCallback((event) => {
    const isCompleted = event.status === 'completed';
    const baseStyle = {
      backgroundColor: isCompleted ? '#94B49F' : '#7FB069',
      borderRadius: '4px',
      opacity: isCompleted ? 0.7 : 1,
      color: '#fff',
      border: 'none',
      display: 'block',
    };

    return {
      style: baseStyle
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Learning Calendar</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-soft p-6">
          <Calendar
            localizer={localizer}
            events={tasks}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 250px)' }}
            onSelectEvent={handleTaskClick}
            eventPropGetter={eventStyleGetter}
          />
        </div>

        {selectedTask && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedTask(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 transform scale-95 opacity-0 animate-dialog"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FaTimes className="text-gray-400 hover:text-gray-600" size={18} />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-900">Task:</span> {selectedTask.title}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-900">Plan:</span> {selectedTask.planName}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-900">Status:</span>{' '}
                    <span className={`${
                      selectedTask.status === 'completed' ? 'text-accent' : 'text-gray-700'
                    }`}>
                      {selectedTask.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </p>
                </div>

                {selectedTask.status !== 'completed' && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleMarkComplete}
                      className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg flex items-center gap-2 transition-colors duration-200"
                    >
                      <FaCheck size={14} />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          .rbc-calendar {
            background: white;
            padding: 1rem;
            border-radius: 0.5rem;
          }
          .rbc-toolbar button {
            color: #4A4A4A;
          }
          .rbc-toolbar button:hover {
            background-color: #F3F4F6;
          }
          .rbc-toolbar button.rbc-active {
            background-color: #7FB069 !important;
            color: white;
          }
          .rbc-toolbar button.rbc-active:hover {
            background-color: #6A9557 !important;
          }
          .rbc-today {
            background-color: #F3F4F6;
          }
          .rbc-off-range-bg {
            background-color: #F8F8F8;
          }
          .rbc-header {
            padding: 0.5rem;
            font-weight: 600;
            color: #4A4A4A;
          }
          .rbc-event {
            padding: 0.25rem 0.5rem;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            to { 
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .animate-dialog {
            animation: slideUp 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
}
