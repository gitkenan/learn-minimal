import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header';
import { initializeSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function ExamResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [examResults, setExamResults] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    async function saveExamResults() {
      if (typeof window === 'undefined' || !user || hasSaved) return;

      setHasSaved(true); // Mark that we're saving so we don't do it again

      const stored = localStorage.getItem('examResults');
      if (!stored) {
        router.replace('/exam');
        return;
      }

      const results = JSON.parse(stored);
      
      try {
        const supabase = initializeSupabase();
        const { data, error } = await supabase
          .from('exam_results')
          .insert([
            {
              user_id: user.id,
              subject: results.subject,
              difficulty: results.difficulty,
              question_type: results.questionType,
              messages: results.messages,
              final_analysis: results.finalAnalysis,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Clear localStorage after successful save
        localStorage.removeItem('examResults');
        
        // Redirect to dashboard after saving
        router.replace('/dashboard');
      } catch (err) {
        console.error('Error saving exam results:', err);
        setError(err.message);
        setExamResults(results);
        setSaving(false);
      }
    }

    saveExamResults();
  }, [router, user, hasSaved]);

  if (saving && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Saving your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              Error saving results: {error}
            </div>
            {examResults && <ExamResultDisplay examResults={examResults} />}
          </div>
        </main>
      </div>
    );
  }

  return null;
}

function ExamResultDisplay({ examResults }) {
  const [showHistory, setShowHistory] = useState(false);
  
  // All messages are Q&A transcripts
  const chatMessages = examResults.messages || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-6">
              Exam Results: {examResults.subject}
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="bg-gray-50 px-4 py-3 rounded-lg flex-1">
                <span className="text-gray-500 text-sm block mb-1">Difficulty</span>
                <p className="font-medium text-gray-900">{examResults.difficulty}</p>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-lg flex-1">
                <span className="text-gray-500 text-sm block mb-1">Type</span>
                <p className="font-medium text-gray-900">{examResults.questionType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <section className="bg-white rounded-lg border p-6">
              <h2 className="text-2xl font-semibold mb-6">Detailed Report</h2>
              {examResults.final_analysis ? (
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="prose prose-gray prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600">
                    <ReactMarkdown>{examResults.final_analysis}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  No final analysis found.
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
                        <div
                          className={`text-sm font-medium px-3 py-1 rounded-full ${
                            m.isAI 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-green-50 text-green-800'
                          }`}
                        >
                          {m.isAI ? 'AI Response' : 'Student Answer'}
                        </div>
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
