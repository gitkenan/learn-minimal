import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header';
import { initializeSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function SavedExamResultPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [examResult, setExamResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    async function fetchExamResult() {
      if (!id || !user) return;

      try {
        const supabase = initializeSupabase();
        const { data, error } = await supabase
          .from('exam_results')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Result not found');

        setExamResult(data);
      } catch (err) {
        console.error('Error fetching exam result:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchExamResult();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading result...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        </main>
      </div>
    );
  }

  const messages = examResult.messages || [];
  const finalAiMessage = messages.slice().reverse().find((m) => m.isAI);
  const chatMessages = messages
    .filter(m => 
      m.text.includes('PERFORMANCE ASSESSMENT') || 
      m.text.includes('Clinical Case') ||
      m.text.includes('Question:')
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-6">
              Exam Results: {examResult.subject}
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="bg-gray-50 px-4 py-3 rounded-lg flex-1">
                <span className="text-gray-500 text-sm block mb-1">Difficulty</span>
                <p className="font-medium text-gray-900">{examResult.difficulty}</p>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-lg flex-1">
                <span className="text-gray-500 text-sm block mb-1">Type</span>
                <p className="font-medium text-gray-900">{examResult.question_type}</p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <section className="bg-white rounded-lg border p-6">
              <h2 className="text-2xl font-semibold mb-6">Detailed Report</h2>
              {finalAiMessage ? (
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="prose prose-gray prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600">
                    <ReactMarkdown>{finalAiMessage.text}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  Couldn't locate a final summary. Possibly the exam didn't
                  finish properly.
                </p>
              )}
            </section>

            <section className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Chat History</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                >
                  {showHistory ? '↑ Hide' : '↓ Show'} History
                </button>
              </div>

              {showHistory && (
                <div className="max-h-[32rem] overflow-y-auto border rounded-lg bg-white shadow-sm">
                  {chatMessages.map((m, i) => (
                    <div 
                      key={i} 
                      className={`p-4 ${i !== 0 ? 'border-t' : ''} ${
                        m.isAI ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {m.text.includes('PERFORMANCE ASSESSMENT') ? (
                          <div className="bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            Assessment
                          </div>
                        ) : m.text.includes('Clinical Case') ? (
                          <div className="bg-purple-50 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                            Case Details
                          </div>
                        ) : (
                          <div
                            className={`text-sm font-medium px-3 py-1 rounded-full ${
                              m.isAI 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-green-50 text-green-800'
                            }`}
                          >
                            {m.isAI ? 'AI Response' : 'Student Answer'}
                          </div>
                        )}
                        {m.text.includes('Correct') && (
                          <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                            <span className="text-lg">✓</span> Correct
                          </span>
                        )}
                        {m.text.includes('Partly correct') && (
                          <span className="text-yellow-600 text-sm font-medium flex items-center gap-1">
                            <span className="text-lg">◐</span> Partially Correct
                          </span>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none prose-p:text-gray-600 prose-strong:text-gray-900 prose-ul:my-2 prose-headings:text-lg">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
