import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';
import Header from '@/components/Header';
import Link from 'next/link';
import PlanCard from '@/components/PlanCard';
import { FaCheck, FaTrashAlt, FaTimes, FaCog } from 'react-icons/fa';

export default function Dashboard() {
  const { user, session, loading: authLoading, sessionReady } = useAuth();
  const [plans, setPlans] = useState([]);
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

  useEffect(() => {
    const fetchPlans = async () => {
      console.log('fetchPlans called');
      try {
        setLoading(true);
        setError('');

        const supabase = initializeSupabase();

        if (!supabase) {
          throw new Error('Failed to initialize Supabase client');
        }

        const { data, error: supabaseError } = await supabase
          .from('plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        console.log('fetchPlans data:', data);
        console.log('fetchPlans error:', supabaseError);

        if (supabaseError) throw supabaseError;

        setPlans(data || []);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (sessionReady) {
      fetchPlans();
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
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your learning plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {showToast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg shadow-lg border border-green-100 animate-slide-up z-[60]">
          <div className="bg-green-100 rounded-full p-1">
            <FaCheck className="text-green-600 w-4 h-4" />
          </div>
          <p className="font-medium">
            "{deletedPlanName}" has been deleted
          </p>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border mb-6"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

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
      </div>

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
                Are you sure you want to delete <span className="font-medium text-gray-900">"{planToDelete?.topic}"</span>? 
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
