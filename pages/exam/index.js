import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { initializeSupabase } from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

export default function AIExaminerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [experience, setExperience] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('short-answer');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [messages, setMessages] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    const examConfig = localStorage.getItem('examConfig');
    if (examConfig) {
      const config = JSON.parse(examConfig);
      setSubject(config.subject);
      setDifficulty(config.difficulty);
      setQuestionType(config.questionType);
      setSystemInstructions(config.systemInstructions);
      
      // Update title based on section/item context
      document.title = config.itemId 
        ? `Exam: ${config.subject}`
        : config.sectionId 
          ? `Section Exam: ${config.subject}`
          : 'Full Plan Exam';
          
      localStorage.removeItem('examConfig');
    }
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
    
    // Send a more structured initial prompt
    const initialPrompt = `You are an AI examiner conducting a ${difficulty} level exam on ${subject}.
      Student experience level: ${experience || 'beginner'}
      Question type: ${questionType}
      ${systemInstructions ? `Special instructions: ${systemInstructions}` : ''}

      Begin by asking a single ${questionType} question. Do not provide the answer yet.
      Keep the difficulty at ${difficulty} level throughout the exam.
      Focus on core concepts and practical applications.`;

    await handleAIRequest(initialPrompt, initialMessages);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAIRequest = async (prompt, localMessages = messages) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, messages: localMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to process request');
      }

      if (!data?.response) {
        throw new Error('Invalid response from server');
      }

      setMessages([...localMessages, { isAI: true, text: data.response }]);
      scrollToBottom();
    } catch (err) {
      console.error('Error in exam:', err);
      setError(err.message || 'An error occurred while processing your request');
      if (userAnswer) {
        setUserAnswer(userAnswer); // Preserve user's message on error
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    const newChat = [...messages, { isAI: false, text: userAnswer }];
    setUserAnswer('');
    await handleAIRequest(
      `The student answered: ${userAnswer}.
      Provide immediate feedback on this answer and ask the next question.
      Do not evaluate overall performance yet.`,
      newChat
    );
  };

  const finalizeExam = async () => {
    // Filter out last message if it's an unanswered question from AI
    const messagesToAnalyze = messages.length > 0 && messages[messages.length - 1].isAI 
      ? messages.slice(0, -1) 
      : messages;
    
    const fullHistory = messagesToAnalyze.map((m) => (m.isAI ? `AI: ${m.text}` : `Student: ${m.text}`)).join('\n');
    
    try {
        const response = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Here is the complete Q&A session:\n${fullHistory}\n\n
          You are an AI examiner conducting a final analysis. ${systemInstructions ? `This was a specialized exam with instructions: "${systemInstructions}". ` : ''}
          Based ONLY on the actual exchanges above, provide a comprehensive analysis of the student's performance.
          
          Please provide a comprehensive analysis with the following elements, using natural language and clear formatting:

          • Start with a brief introduction or summary as to how the exam went in general. Try to focus more on positives to not discourage them, but stay realistic.
          ${systemInstructions ? '• Take into account how the special examination focus was addressed.\n' : ''}
          
          • Assess their overall performance by discussing:
            - Notable strengths shown during the exam
            - Areas where improvement would be beneficial
            - Their grasp of fundamental concepts
            ${systemInstructions ? '- How well they handled the specialized aspects\n' : ''}
          
          • Conclude with constructive guidance:
            - Key topics they should focus on reviewing
            - Helpful resources and practice suggestions, only providing links if youre 100% certain of their accuracy

          Use clear headings and natural paragraph breaks for readability. Focus on being constructive and specific.
          Be specific and reference actual answers given. Do not make assumptions about knowledge not demonstrated in the exchanges.`,
          messages: messagesToAnalyze
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get final analysis');
      }

      const data = await response.json();
      
      if (!data?.response) {
        throw new Error('Invalid response from server');
      }

      // Store messages and final analysis separately, excluding last unanswered question if present
      const examResults = {
        subject,
        difficulty,
        questionType,
        messages: messagesToAnalyze, // Store only answered Q&A pairs
        finalAnalysis: data.response, // Store final analysis separately
        finishedAt: new Date().toISOString(),
      };

      // Save to localStorage and navigate
      localStorage.setItem('examResults', JSON.stringify(examResults));
      router.push('/exam/results');
    } catch (err) {
      setError(err.message || 'Failed to complete exam');
      console.error('Error:', err);
    }
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
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
        <div className="w-full max-w-2xl bg-surface p-6 rounded-lg shadow-claude">
          {!showQuiz ? (
            <>
                <div className="mb-8 text-center">
                <h1 className="text-primary text-3xl font-semibold mb-2">
                  {subject ? (
                  <>
                    {systemInstructions?.includes('specifically about:') 
                    ? 'Task-Specific Exam'
                    : systemInstructions?.includes('from the section:')
                      ? 'Section Exam'
                      : 'Full Plan Exam'}
                  </>
                  ) : (
                  'AI Examiner Setup'
                  )}
                </h1>
                {subject && (
                  <p className="text-secondary text-lg mb-2">
                  {subject}
                  </p>
                )}
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

                <textarea
                  placeholder="System Instructions (optional) - e.g., 'give me medical cases to diagnose'"
                  className="w-full p-4 text-primary bg-background border border-claude-border 
                           rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                           transition-colors duration-200 min-h-[100px]"
                  value={systemInstructions}
                  onChange={(e) => setSystemInstructions(e.target.value)}
                  disabled={isLoading}
                />

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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
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
