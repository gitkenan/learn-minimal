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
      borderRadius: '3px',
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
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Learning Calendar</h1>
        
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 text-red-600 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-1 sm:p-3">
          <Calendar
            localizer={localizer}
            events={tasks}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 160px)' }}
            onSelectEvent={handleTaskClick}
            eventPropGetter={eventStyleGetter}
            views={['month']}
            defaultView="month"
            toolbar={{
              left: 'prev,next',
              center: 'title',
              right: null
            }}
            messages={{
              previous: '◀',
              next: '▶'
            }}
            components={{
              toolbar: props => {
                return (
                  <div className="rbc-toolbar">
                    <span className="rbc-btn-group">
                      <button type="button" onClick={() => props.onNavigate('PREV')}>◀</button>
                      <button type="button" onClick={() => props.onNavigate('NEXT')}>▶</button>
                    </span>
                    <span className="rbc-toolbar-label">{props.label}</span>
                  </div>
                );
              }
            }}
          />
        </div>

        {selectedTask && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedTask(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-0 sm:p-2 transform scale-95 opacity-0 animate-dialog"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FaTimes className="text-gray-400 hover:text-gray-600" size={18} />
                  </button>
                </div>
                
                <div className="space-y-3 mb-4">
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
            padding: 0.25rem;
            border-radius: 0.5rem;
            font-size: 12px;
          }
          @media (min-width: 640px) {
            .rbc-calendar {
              padding: 0.75rem;
              font-size: 14px;
            }
          }
          .rbc-month-view {
            border: none;
          }
          .rbc-month-row {
            border-top: 1px solid #f0f0f0;
          }
          .rbc-day-bg {
            border-left: 1px solid #f0f0f0;
          }
          .rbc-date-cell {
            padding: 0.15rem;
            text-align: center;
            color: #666;
            font-size: 0.85em;
          }
          .rbc-date-cell.rbc-now {
            font-weight: 500;
            color: #7FB069;
          }
          .rbc-toolbar {
            flex-wrap: wrap;
            gap: 0.25rem;
            justify-content: center;
            margin-bottom: 0.25rem;
          }
          .rbc-toolbar-label {
            width: 100%;
            text-align: center;
            margin: 0.15rem 0;
            font-weight: 500;
            font-size: 1em;
            color: #4A4A4A;
          }
          @media (min-width: 640px) {
            .rbc-toolbar {
              flex-wrap: nowrap;
              gap: 0;
              justify-content: space-between;
              margin-bottom: 0.5rem;
            }
            .rbc-toolbar-label {
              width: auto;
              margin: 0;
              font-size: 1.1em;
            }
          }
          .rbc-toolbar button {
            color: #4A4A4A;
            padding: 0.35rem 0.5rem;
            min-width: 32px;
            font-size: 1em;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            margin: 0 2px;
          }
          .rbc-toolbar button:hover {
            background-color: #f9fafb;
            border-color: #d1d5db;
          }
          .rbc-btn-group {
            display: flex;
            gap: 4px;
          }
          .rbc-today {
            background-color: #fafdf7;
          }
          .rbc-off-range-bg {
            background-color: #fafafa;
          }
          .rbc-header {
            padding: 0.15rem;
            font-weight: 500;
            color: #666;
            font-size: 0.8em;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
          @media (min-width: 640px) {
            .rbc-header {
              padding: 0.25rem;
              font-size: 0.85em;
            }
          }
          .rbc-event {
            padding: 0.1rem 0.25rem;
            margin: 1px 0;
            min-height: 1.5rem;
            font-size: 0.8em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          @media (min-width: 640px) {
            .rbc-event {
              padding: 0.15rem 0.35rem;
              min-height: 1.75rem;
              font-size: 0.85em;
            }
          }
          .rbc-events-container {
            margin-right: 1px;
          }
          .rbc-row-content {
            z-index: 1;
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
