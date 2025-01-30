import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function SavedExamResultPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [examResult, setExamResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showQA, setShowQA] = useState(false);

  useEffect(() => {
    async function fetchExamResult() {
      if (!id || !user) return;

      try {
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
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        </main>
      </div>
    );
  }

  const chatMessages = examResult.messages || [];
  const qaHistory = examResult.qa_history || [];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <div className="mb-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                {examResult.title || examResult.subject}
              </h1>
              <div className="flex gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {examResult.subject}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                  {examResult.difficulty.charAt(0).toUpperCase() + examResult.difficulty.slice(1)} Difficulty
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <section className="bg-white rounded-lg border p-6">
              {examResult.final_analysis ? (
                <div className="bg-gray-50 p-8 rounded-lg border">
                  <div className="prose prose-lg max-w-none prose-gray 
                    prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mt-8 prose-headings:mb-4 first:prose-headings:mt-0
                    prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
                    prose-ul:my-4 prose-li:text-gray-600 prose-li:my-2 prose-li:leading-relaxed
                    prose-strong:text-gray-800">
                    <ReactMarkdown>{examResult.final_analysis}</ReactMarkdown>
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
                <h2 className="text-2xl font-semibold">Questions & Answers</h2>
                <button
                  onClick={() => setShowQA(!showQA)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                >
                  {showQA ? '↑ Hide' : '↓ Show'} Q&A
                </button>
              </div>

              {showQA && (
                <div className="max-h-[32rem] overflow-y-auto border rounded-lg bg-white shadow-sm">
                  {qaHistory.map((qa, i) => (
                    <div
                      key={i}
                      className={`p-4 ${i !== 0 ? 'border-t' : ''}`}
                    >
                      <div className="mb-4">
                        <div className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-800 inline-block mb-2">
                          Question {i + 1}
                        </div>
                        <div className="prose prose-sm max-w-none prose-p:text-gray-600 prose-strong:text-gray-900">
                          <ReactMarkdown>{qa.question}</ReactMarkdown>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium px-3 py-1 rounded-full bg-green-50 text-green-800 inline-block mb-2">
                          Your Answer
                        </div>
                        <div className="prose prose-sm max-w-none prose-p:text-gray-600 prose-strong:text-gray-900">
                          <ReactMarkdown>{qa.answer}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
