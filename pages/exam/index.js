import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header';

export default function AIExaminerPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [experience, setExperience] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('short-answer');
  const [messages, setMessages] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    // Optionally, load any existing exam session here.
  }, [user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const startQuiz = async () => {
    // Start with an initial user message to set up the exam
    const initialMessages = [{
      isAI: false,
      text: `I want to take an exam on ${subject}. My experience level is ${experience || 'beginner'}. 
      Please ask me ${questionType} questions at ${difficulty} difficulty level.`
    }];
    
    setMessages(initialMessages);
    setShowQuiz(true);
    
    await handleAIRequest(
      `You are an AI examiner. The student wants to test themselves on: ${subject}.
      They have ${experience || 'no declared'} experience. 
      The difficulty level is ${difficulty}, and question type is ${questionType}.
      Begin by asking a single question, no answer yet. Stay instructive and direct.`
    );
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAIRequest = async (prompt, localMessages = messages) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/exam-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, messages: localMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process request');
      }

      const data = await response.json();
      
      if (!data?.response) {
        throw new Error('Invalid response from server');
      }

      setMessages([...localMessages, { isAI: true, text: data.response }]);
      scrollToBottom();
    } catch (err) {
      setError(err.message || 'An error occurred while processing your request');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    const newChat = [...messages, { isAI: false, text: userAnswer }];
    setUserAnswer('');
    await handleAIRequest(
      `The student answered: ${userAnswer}.
      Evaluate or continue questioning. Keep track of performance but do not reveal it yet.`,
      newChat
    );
  };

  const finalizeExam = async () => {
    const fullHistory = messages.map((m) => (m.isAI ? `AI: ${m.text}` : `Student: ${m.text}`)).join('\n');
    await handleAIRequest(
      `Here is the entire Q&A:\n${fullHistory}\n\nNow provide an overall analysis with a final summary of performance.`,
      messages
    );
  };
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-claude">
            <h1 className="text-primary text-3xl font-semibold mb-4 text-center">
              AI Examiner
            </h1>
            <p className="text-secondary text-center mb-8">
              Please sign in to access the AI Examiner.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push('/auth')}
                className="search-button"
              >
                Sign In
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
        <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-claude">
          {!showQuiz ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-primary text-3xl font-semibold mb-2">
                  AI Examiner Setup
                </h1>
                <p className="text-secondary text-lg">
                  Configure your examination session
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full p-4 text-primary bg-background border border-claude-border 
                           rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                           transition-colors duration-200"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isLoading}
                />
                
                <input
                  type="text"
                  placeholder="Experience (optional)"
                  className="w-full p-4 text-primary bg-background border border-claude-border 
                           rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                           transition-colors duration-200"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  disabled={isLoading}
                />

                <select
                  className="w-full p-4 text-primary bg-background border border-claude-border 
                           rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                           transition-colors duration-200"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  className="w-full p-4 text-primary bg-background border border-claude-border 
                           rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                           transition-colors duration-200"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="short-answer">Short-Answer</option>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="essay">Essay</option>
                </select>

                <button 
                  onClick={startQuiz}
                  disabled={!subject.trim() || isLoading}
                  className="w-full p-4 bg-accent hover:bg-accent-hover text-white rounded-lg
                           transition-colors duration-200 disabled:opacity-50
                           font-medium text-base flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting...
                    </>
                  ) : (
                    'Start Exam'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1">
                <div ref={chatRef} className="h-[calc(100vh-300px)] overflow-y-auto bg-background rounded-lg p-4 border border-claude-border">
                  {messages.map((m, i) => (
                    <div key={i} className={`mb-4 ${m.isAI ? 'text-left' : 'text-right'}`}>
                      <div
                        className={`inline-block max-w-[80%] px-4 py-3 rounded-lg ${
                          m.isAI 
                            ? 'bg-surface border border-claude-border text-primary' 
                            : 'bg-accent text-white'
                        }`}
                      >
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 p-4 text-primary bg-background border border-claude-border 
                           rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                           transition-colors duration-200"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={isLoading}
                />
                <button 
                  onClick={submitAnswer}
                  disabled={isLoading || !userAnswer.trim()}
                  className="px-6 bg-accent hover:bg-accent-hover text-white rounded-lg
                           transition-colors duration-200 disabled:opacity-50"
                >
                  Send
                </button>
                <button 
                  onClick={finalizeExam}
                  disabled={isLoading || messages.length < 2}
                  className="px-6 bg-gray-500 hover:bg-gray-600 text-white rounded-lg
                           transition-colors duration-200 disabled:opacity-50"
                >
                  Finish
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}