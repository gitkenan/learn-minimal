import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { useAuth } from '@/context/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/lib/supabaseClient';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Loading } from '@/components/ui/loading';
import { Spinner } from '@/components/ui/spinner';

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

// Mobile-optimized toolbar with simple navigation
const MobileToolbar = ({ onNavigate, label }) => (
  <div className="rbc-toolbar">
    <div className="flex items-center justify-between w-full px-2">
      <button 
        type="button" 
        onClick={() => onNavigate('PREV')}
        className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="text-xl">←</span>
      </button>
      <span className="rbc-toolbar-label text-lg">{label}</span>
      <button 
        type="button" 
        onClick={() => onNavigate('NEXT')}
        className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="text-xl">→</span>
      </button>
    </div>
  </div>
);

// Desktop toolbar with full navigation and view options
const DesktopToolbar = ({ onNavigate, onView, label, view }) => (
  <div className="rbc-toolbar">
    <span className="rbc-btn-group">
      <button type="button" onClick={() => onNavigate('PREV')}>
        <span className="text-lg">←</span>
      </button>
      <button type="button" onClick={() => onNavigate('TODAY')}>Today</button>
      <button type="button" onClick={() => onNavigate('NEXT')}>
        <span className="text-lg">→</span>
      </button>
    </span>
    <span className="rbc-toolbar-label">{label}</span>
    <span className="rbc-btn-group">
      <button 
        type="button" 
        onClick={() => onView('day')}
        className={view === 'day' ? 'rbc-active' : ''}
      >
        Day
      </button>
      <button 
        type="button" 
        onClick={() => onView('week')}
        className={view === 'week' ? 'rbc-active' : ''}
      >
        Week
      </button>
      <button 
        type="button" 
        onClick={() => onView('month')}
        className={view === 'month' ? 'rbc-active' : ''}
      >
        Month
      </button>
    </span>
  </div>
);

export default function CalendarPage() {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [taskCache, setTaskCache] = useState({});
  
  const calendarRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const { toggleTask: planToggleTask, refresh: refreshPlan, plan } = usePlan(selectedTask?.planId || null);
  
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
      // initializeSupabase was here!

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

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && selectedTask) {
      setSelectedTask(null);
      if (calendarRef.current) {
        calendarRef.current.scrollTop = scrollPosition;
      }
    }
  }, [selectedTask, scrollPosition]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management
  useEffect(() => {
    if (selectedTask && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [selectedTask]);

  const handleTaskClick = useCallback(async (event) => {
    if (calendarRef.current) {
      setScrollPosition(calendarRef.current.scrollTop);
    }

    setDetailLoading(true);
    
    try {
      // Check cache first
      if (taskCache[event.id]) {
        setSelectedTask(taskCache[event.id]);
        setDetailLoading(false);
        return;
      }

      // Fetch additional task details if needed
      // initializeSupabase was here!
      const { data, error } = await supabase
        .from('calendar_tasks')
        .select('*, plans:plan_id (*)')
        .eq('id', event.id)
        .single();

      if (error) throw error;

      const enrichedTask = {
        ...event,
        ...data,
        planDetails: data.plans
      };

      // Update cache
      setTaskCache(prev => ({
        ...prev,
        [event.id]: enrichedTask
      }));

      setSelectedTask(enrichedTask);
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Failed to load task details');
    } finally {
      setDetailLoading(false);
    }
  }, [taskCache]);

  const handleMarkComplete = async () => {
    if (!selectedTask) return;

    try {
      setError('');
      
      // Optimistically update the task in the local state
      const updatedTasks = tasks.map(task => {
        if (task.id === selectedTask.id) {
          return { ...task, status: 'completed' };
        }
        return task;
      });
      setTasks(updatedTasks);
      
      // Update task cache
      if (taskCache[selectedTask.id]) {
        setTaskCache(prev => ({
          ...prev,
          [selectedTask.id]: { ...prev[selectedTask.id], status: 'completed' }
        }));
      }

      // Close modal before the async operation
      setSelectedTask(null);

      // Perform the actual update - no need to fetchTasks since we have optimistic updates
      await toggleTask();
      
      // Note: We don't need to fetchTasks here since:
      // 1. We've already updated the UI optimistically above
      // 2. The toggleTask function in usePlan.js handles the optimistic update
      // 3. Any real-time updates will be handled by the Supabase subscription
    } catch (err) {
      console.error('Error marking task complete:', err);
      setError('Failed to update task status');
      
      // Revert optimistic update on error
      fetchTasks();
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
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      transform: 'translateY(0)',
    };

    return {
      style: baseStyle,
      className: 'calendar-event-interactive'
    };
  }, []);

  // Add styles for hover and focus states
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .calendar-event-interactive {
        position: relative;
      }
      .calendar-event-interactive:hover,
      .calendar-event-interactive:focus-within {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        opacity: 0.9 !important;
      }
      .calendar-event-interactive:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
      }
      .rbc-calendar {
        position: relative;
      }
      .rbc-calendar::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        transition: background-color 0.2s ease;
      }
      .rbc-calendar.loading::after {
        background-color: rgba(255, 255, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loading
            variant="spinner"
            size="lg"
            message="Loading your calendar..."
            className="text-accent"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-3 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-0">Learning Calendar</h1>
          <div className="hidden sm:flex items-center space-x-2 text-sm">
            <span className="text-secondary">Legend:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-sm bg-accent"></div>
              <span className="text-secondary">Pending</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-sm bg-accent-secondary opacity-70"></div>
              <span className="text-secondary">Completed</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 text-red-600 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-strong p-1 sm:p-3">
          <Calendar
            localizer={localizer}
            events={tasks}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 160px)' }}
            onSelectEvent={handleTaskClick}
            eventPropGetter={eventStyleGetter}
            views={isDesktop ? {
              day: true,
              week: true,
              month: true,
              agenda: false
            } : {
              month: true
            }}
            defaultView="month"
            components={{
              toolbar: props => {
                const CustomToolbar = isDesktop ? DesktopToolbar : MobileToolbar;
                return <CustomToolbar {...props} />;
              }
            }}
          />
        </div>

        <AnimatePresence>
          {selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
              onClick={() => {
                setSelectedTask(null);
                if (calendarRef.current) {
                  calendarRef.current.scrollTop = scrollPosition;
                }
              }}
              role="dialog"
              aria-labelledby="task-detail-title"
              aria-modal="true"
            >
              <ErrorBoundary
                FallbackComponent={({ error, resetErrorBoundary }) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-xl p-6 m-4 max-w-sm w-full"
                  >
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Task</h3>
                    <p className="text-gray-600 mb-4">{error.message}</p>
                    <button
                      onClick={resetErrorBoundary}
                      className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Try Again
                    </button>
                  </motion.div>
                )}
                onReset={() => {
                  handleTaskClick(selectedTask);
                }}
              >
                <motion.div
                  ref={modalRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-0 sm:p-2 isolate"
                  role="document"
                  tabIndex="-1"
                >
                  <div className="p-4 sm:p-6">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loading
                          variant="spinner"
                          size="lg"
                          message="Loading task details..."
                          className="text-accent"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 id="task-detail-title" className="text-lg font-semibold text-gray-900">
                            Task Details
                          </h3>
                          <button
                            ref={closeButtonRef}
                            onClick={() => {
                              setSelectedTask(null);
                              if (calendarRef.current) {
                                calendarRef.current.scrollTop = scrollPosition;
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            aria-label="Close task details"
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
                      </>
                    )}
                  </div>
                </motion.div>
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx global>{`
          .rbc-calendar {
            background: transparent;
            padding: 0.25rem;
            border-radius: 0.5rem;
            font-size: 14px;
          }
          .rbc-month-view,
          .rbc-time-view {
            background: white;
            border-radius: 0.5rem;
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
            padding: 0.5rem 0.25rem;
            text-align: center;
            color: #666;
            font-size: 0.9em;
          }
          .rbc-date-cell.rbc-now {
            font-weight: 600;
            color: #7FB069;
          }
          .rbc-toolbar {
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
            margin-bottom: 1rem;
            padding: 0.5rem;
            background-color: #fafafa;
            border-radius: 0.5rem;
          }
          .rbc-toolbar-label {
            font-weight: 600;
            font-size: 1.1em;
            color: #1A1A1A;
          }
          @media (min-width: 640px) {
            .rbc-toolbar {
              flex-wrap: nowrap;
              gap: 1rem;
              justify-content: space-between;
              margin-bottom: 1rem;
            }
            .rbc-toolbar-label {
              font-size: 1.2em;
            }
          }
          .rbc-toolbar button {
            color: #4A4A4A;
            padding: 0.5rem 1rem;
            min-width: 40px;
            font-size: 0.95em;
            font-weight: 500;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            margin: 0 2px;
            transition: all 0.2s ease;
          }
          .rbc-toolbar button:hover {
            background-color: #f9fafb;
            border-color: #7FB069;
            color: #7FB069;
          }
          .rbc-toolbar button.rbc-active {
            background-color: #7FB069;
            border-color: #7FB069;
            color: white;
          }
          .rbc-toolbar button.rbc-active:hover {
            background-color: #6A9557;
            border-color: #6A9557;
            color: white;
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
            padding: 0.75rem 0.5rem;
            font-weight: 600;
            color: #4A4A4A;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #f0f0f0;
          }
          @media (min-width: 640px) {
            .rbc-header {
              padding: 1rem 0.5rem;
              font-size: 0.9em;
            }
          }
          .rbc-event {
            padding: 0.35rem 0.5rem;
            margin: 1px 0;
            min-height: 2rem;
            font-size: 0.9em;
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
