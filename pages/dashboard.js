import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';
import { FaTrashAlt, FaTimes, FaCheck } from 'react-icons/fa';

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
      
      // Hide toast after 3 seconds
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
      <Head>
        <title>Dashboard - Learn Minimal</title>
        <meta name="description" content="Your learning plans dashboard" />
      </Head>

      {/* Success Toast */}
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-semibold text-primary">Your Learning Plans</h1>
            <Link href="/">
              <span className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors duration-200 cursor-pointer">
                Create New Plan
              </span>
            </Link>
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search your plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {/* Plans Grid */}
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'No plans match your search.' : 'You haven\'t created any plans yet.'}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative"
                >
                  <Link href={`/plan/${plan.id}`} className="block">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {plan.topic}
                    </h2>
                    <div className="text-sm text-gray-500 mb-4">
                      Created {new Date(plan.created_at).toLocaleDateString()}
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{plan.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all duration-300"
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteConfirmation(plan);
                    }}
                    className="absolute top-3 right-3 p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-all duration-200"
                    title="Delete Plan"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
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
      </main>

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