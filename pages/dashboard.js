import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import PlanCard from '@/components/PlanCard';
import ExamResults from '@/components/ExamResults';
import { FaCheck, FaTrashAlt, FaTimes, FaCog, FaGraduationCap } from 'react-icons/fa';
import { Loading } from '@/components/ui/loading';

export default function Dashboard() {
  const { user, session, loading: authLoading, sessionReady } = useAuth();
  const [plans, setPlans] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [deletedPlanName, setDeletedPlanName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [experience, setExperience] = useState('');
  const [timeline, setTimeline] = useState('');
  const [examToDelete, setExamToDelete] = useState(null);
  const [isDeletingExam, setIsDeletingExam] = useState(false);
  const [deletedExamName, setDeletedExamName] = useState('');
  const [showExamResults, setShowExamResults] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log('fetchData called');
      try {
        setLoading(true);
        setError('');

        const supabase = initializeSupabase();

        if (!supabase) {
          throw new Error('Failed to initialize Supabase client');
        }

        // Fetch plans
        const { data: plansData, error: plansError } = await supabase
          .from('plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (plansError) throw plansError;
        setPlans(plansData || []);

        // Fetch exam results
        const { data: examData, error: examError } = await supabase
          .from('exam_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (examError) throw examError;
        setExamResults(examData || []);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (sessionReady) {
      fetchData();
    }
  }, [sessionReady, user?.id]);

  const handleDeleteConfirmation = (plan) => {
    setPlanToDelete(plan);
    setIsDeleting(true);
  };

  const cancelDelete = () => {
    setPlanToDelete(null);
    setIsDeleting(false);
  };

  const handleExamDeleteConfirmation = (exam) => {
    setExamToDelete(exam);
    setIsDeletingExam(true);
  };

  const cancelExamDelete = () => {
    setExamToDelete(null);
    setIsDeletingExam(false);
  };

  const handleExamDelete = async () => {
    if (!examToDelete) return;

    try {
      const supabase = initializeSupabase();
      const { error } = await supabase
        .from('exam_results')
        .delete()
        .eq('id', examToDelete.id);

      if (error) throw error;

      setExamResults(examResults.filter((exam) => exam.id !== examToDelete.id));
      setDeletedExamName(examToDelete.subject);
      setExamToDelete(null);
      setIsDeletingExam(false);
      setShowToast(true);
      
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error('Error deleting exam:', error);
      setError('Failed to delete exam result. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;

    try {
      const supabase = initializeSupabase();
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planToDelete.id);

      if (error) throw error;

      setPlans(plans.filter((plan) => plan.id !== planToDelete.id));
      setDeletedPlanName(planToDelete.topic);
      setPlanToDelete(null);
      setIsDeleting(false);
      setShowToast(true);
      
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Failed to delete plan. Please try again.');
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading || !sessionReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loading
            variant="spinner"
            message="Loading your learning plans..."
            className="text-accent-DEFAULT"
            size="lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showToast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg shadow-lg border border-green-100 animate-slide-up z-[60]">
          <div className="bg-green-100 rounded-full p-1">
            <FaCheck className="text-green-600 w-4 h-4" />
          </div>
          <p className="font-medium">
            &quot;{deletedPlanName || deletedExamName}&quot; has been deleted
          </p>
        </div>
      )}

        <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setShowExamResults(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors duration-200 ${
                !showExamResults 
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaCog className="text-current" />
              <span>Learning Plans</span>
            </button>
            <button
              type="button"
              onClick={() => setShowExamResults(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors duration-200 ${
                showExamResults 
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaGraduationCap className="text-current" />
              <span>Exam Results</span>
            </button>
          </div>

          <input
            type="text"
            placeholder={showExamResults ? "Search exam results..." : "Search plans..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border"
          />
          </div>

          {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
          )}

          <div className="space-y-8">
          {showExamResults ? (
            <div>
              <ExamResults examResults={examResults} onDelete={handleExamDeleteConfirmation} />
            </div>
          ) : (
            <div>
              {filteredPlans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchQuery ? 'No plans match your search.' : 'Create your first learning plan!'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPlans.map((plan) => (
                    <PlanCard 
                      key={plan.id} 
                      plan={plan} 
                      onDelete={handleDeleteConfirmation}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          </div>

        </div>
      </div>

        {isDeletingExam && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in"
          onClick={cancelExamDelete}
        >
          <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 transform scale-95 opacity-0 animate-dialog"
          >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Delete Exam Result</h3>
            <button 
              onClick={cancelExamDelete}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <FaTimes className="text-gray-400 hover:text-gray-600" size={18} />
            </button>
            </div>
            
            <p className="text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{examToDelete?.subject}&quot;</span>? 
            This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
            <button
              onClick={cancelExamDelete}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleExamDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <FaTrashAlt size={14} />
              <span>Delete</span>
            </button>
            </div>
          </div>
          </div>
        </div>
        )}

        {isDeleting && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in"
          onClick={cancelDelete}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 transform scale-95 opacity-0 animate-dialog"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Plan</h3>
                <button 
                  onClick={cancelDelete}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <FaTimes className="text-gray-400 hover:text-gray-600" size={18} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{planToDelete?.topic}&quot;</span>? 
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <FaTrashAlt size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
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

        @keyframes slideInUp {
          from {
            transform: translateY(16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .fade-in {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-dialog {
          animation: slideUp 0.3s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
