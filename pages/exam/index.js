import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Loading } from '@/components/ui/loading';

export default function AIExaminerPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [subject, setSubject] = useState('');
  const [experience, setExperience] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [messages, setMessages] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    const examConfig = localStorage.getItem('examConfig');
    if (examConfig) {
      const config = JSON.parse(examConfig);
      setSubject(config.subject);
      setDifficulty(config.difficulty);
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
    requestAnimationFrame(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    });
  };

  const startQuiz = async () => {
    // Start with an initial user message to set up the exam
    const initialMessages = [{
      isAI: false,
      text: `I want to take an exam on ${subject}. My experience level is ${experience || 'average'}.
      Please ask me questions at ${difficulty} difficulty level.`
    }];
    
    setMessages(initialMessages);
    setShowQuiz(true);
    
    // Send a more structured initial prompt
    const initialPrompt = `You are an AI examiner conducting a ${difficulty} level exam on ${subject}.
      Student experience level: ${experience || 'average'}
      ${systemInstructions ? `Special instructions: ${systemInstructions}` : ''}

      Begin by asking a good question. Do not provide the answer yet.
      Keep the difficulty at ${difficulty} level throughout the exam.`;

    await handleAIRequest(initialPrompt, initialMessages);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAIRequest = async (prompt, localMessages = messages) => {
    setIsLoading(true);
    setError(null);
    let hasReceivedFirstChunk = false; // Track first chunk arrival

    try {
      const response = await fetch('/api/exam', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ prompt, messages: localMessages }),
      });

      if (!response.ok) throw new Error('Stream failed to start');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = { isAI: true, text: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
        
        for (const line of lines) {
          const data = JSON.parse(line.replace('data: ', ''));
          
          if (data.chunk) {
            // Immediately hide loading when first chunk arrives
            if (!hasReceivedFirstChunk) {
              setIsLoading(false);
              hasReceivedFirstChunk = true;
            }

            // Split the chunk into words
            const words = data.chunk.split(' ');
            for (const word of words) {
              aiMessage.text += word + ' ';
              setMessages(prev => {
                const existing = prev.find(m => m === aiMessage);
                return existing ? [...prev] : [...prev, aiMessage];
              });
              scrollToBottom();
              await new Promise(resolve => setTimeout(resolve, 50)); // Delay for word-by-word effect
            }
          }

          if (data.response) { // Final message
            setMessages(prev => [
              ...prev.filter(m => m !== aiMessage),
              { isAI: true, text: data.response }
            ]);

            // Handle session refresh if needed
            if (data.session) {
              localStorage.setItem('sb-access-token', data.session.access_token);
              localStorage.setItem('sb-expires-at', data.session.expires_at);
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      setError(err.message || 'Error during stream');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    const currentAnswer = userAnswer;
    // Immediately show user's message
    setMessages(prev => [...prev, { isAI: false, text: currentAnswer }]);
    setUserAnswer('');
    scrollToBottom();
    
    // Then send to AI
    await handleAIRequest(
      `The student answered: ${currentAnswer}.
      Do not evaluate yet. Simply ask another question.`,
      [...messages, { isAI: false, text: currentAnswer }]
    );
  };

  const finalizeExam = async () => {
    // Filter out last message if it's an unanswered question from AI
    const messagesToAnalyze = messages.length > 0 && messages[messages.length - 1].isAI 
      ? messages.slice(0, -1) 
      : messages;
    
    // Extract Q&A pairs from messages
    const qaHistory = messagesToAnalyze.reduce((pairs, msg, i) => {
      if (msg.isAI && messagesToAnalyze[i + 1] && !messagesToAnalyze[i + 1].isAI) {
        pairs.push({
          question: msg.text,
          answer: messagesToAnalyze[i + 1].text
        });
      }
      return pairs;
    }, []);

    const fullHistory = messagesToAnalyze.map((m) => (m.isAI ? `AI: ${m.text}` : `Student: ${m.text}`)).join('\n');
    
    try {
        const response = await fetch('/api/exam', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt: `Here is the complete Q&A session:\n${fullHistory}\n\n
          You are an AI examiner conducting a final analysis. ${systemInstructions ? `This was a specialized exam with instructions: "${systemInstructions}". ` : ''}
          First, provide a concise, engaging title for this exam session that captures its essence (max 60 chars). Format as: TITLE: your title here
          Then, based ONLY on the actual exchanges above, provide a comprehensive analysis of the student's performance.
          
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

      // Extract title from response if present
      const titleMatch = data.response.match(/TITLE: (.*)\n/);
      const title = titleMatch ? titleMatch[1].trim() : subject;
      const analysis = data.response.replace(/TITLE: .*\n/, '').trim();

      // Store messages and final analysis separately, excluding last unanswered question if present
      const examResults = {
        title,
        subject,
        messages: messagesToAnalyze, // Store only answered Q&A pairs
        qaHistory, // Store structured Q&A pairs
        finalAnalysis: analysis, // Store final analysis separately
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
    <div className="min-h-screen bg-[#f8faf9] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8f0eb] to-transparent"></div>
      <main className={`container mx-auto px-4 flex flex-col items-center justify-center min-h-screen relative transition-all duration-500 ease-in-out ${showQuiz ? 'translate-x-0 opacity-100' : 'translate-x-0 opacity-100'}`}>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 text-center bg-gradient-to-r from-[#3c6e47] to-[#98c3a4] bg-clip-text text-transparent">
          AI Examiner
        </h1>
        <p className="text-[#3c6e47]/80 text-center mb-8 text-lg md:text-xl lg:text-2xl max-w-2xl">
          Please sign in to access the AI Examiner.
        </p>
        <button
          onClick={() => router.push('/auth')}
          className="px-8 py-3 text-[#3c6e47] hover:text-[#98c3a4] transition-colors duration-200"
        >
          Sign In
        </button>
      </main>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8f0eb] to-transparent"></div>
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] relative">
          <div className="w-full relative">
            <form className={`w-full max-w-xl flex flex-col gap-6 mx-auto transition-all duration-500 ease-in-out transform ${!showQuiz ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 absolute inset-0'}`}>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 text-center bg-gradient-to-r from-[#3c6e47] to-[#98c3a4] bg-clip-text text-transparent">
                  {subject ? (
                    <>
                      {systemInstructions?.includes('specifically about:') 
                        ? 'Deep Dive Assessment'
                        : systemInstructions?.includes('from the section:')
                          ? 'Milestone Check'
                          : 'Learning Compass'}
                    </>
                  ) : (
                    'Learning Guide'
                  )}
                </h1>
                {subject && (
                  <p className="text-[#3c6e47] text-xl mb-2 text-center">
                    Exploring {subject}
                  </p>
                )}
                <p className="text-[#3c6e47]/80 text-center mb-12 text-lg md:text-xl lg:text-2xl max-w-2xl">
                  {subject 
                    ? "Embark on an interactive journey to explore and validate your expertise"
                    : "Craft your personalized learning experience with our adaptive AI companion"}
                </p>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter a subject to be examined on..."
                  className="w-full px-4 py-3 bg-white border border-[#3c6e47]/20 rounded-lg text-[#3c6e47] placeholder-[#3c6e47]/50 focus:outline-none focus:border-[#3c6e47] transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-center gap-2 text-[#3c6e47]/70 hover:text-[#3c6e47] transition-colors duration-200"
                >
                  <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAdvanced && (
                  <>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Tell us about your experience with this subject (optional)"
                      className="w-full px-4 py-3 bg-white border border-[#3c6e47]/20 rounded-lg text-[#3c6e47] placeholder-[#3c6e47]/50 focus:outline-none focus:border-[#3c6e47] transition-all duration-200"
                      disabled={isLoading}
                    />
                    <select
                      className="w-full px-4 py-3 bg-white border border-[#3c6e47]/20 rounded-lg text-[#3c6e47] placeholder-[#3c6e47]/50 focus:outline-none focus:border-[#3c6e47] transition-all duration-200"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <textarea
                      placeholder="System Instructions (optional) - e.g., 'give me medical cases to diagnose'"
                      className="w-full px-4 py-3 bg-white border border-[#3c6e47]/20 rounded-lg text-[#3c6e47] placeholder-[#3c6e47]/50 focus:outline-none focus:border-[#3c6e47] transition-all duration-200 min-h-[100px]"
                      value={systemInstructions}
                      onChange={(e) => setSystemInstructions(e.target.value)}
                      disabled={isLoading}
                    />
                  </>
                )}

                <button 
                  onClick={startQuiz}
                  disabled={!subject.trim() || isLoading}
                  className="w-full px-6 py-3 bg-[#3c6e47] hover:bg-[#98c3a4] text-white rounded-lg 
                           transition-all duration-200 disabled:opacity-50 disabled:bg-[#3c6e47]/50 
                           flex items-center justify-center font-medium text-base"
                >
                  {isLoading ? (
                    <>
                      <Loading
                        variant="spinner"
                        size="sm"
                        className="text-white -ml-1 mr-3"
                      />
                      Starting...
                    </>
                  ) : (
                    'Start Exam'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className={`w-full flex flex-col h-full mx-auto transition-all duration-500 ease-in-out transform ${showQuiz ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 absolute inset-0'}`}>
              <div className="flex-1">
                <div ref={chatRef} className="h-[calc(100vh-200px)] overflow-y-auto">
                  {messages.map((m, i) => (
                    <div 
                      key={`${i}-${m.text.substring(0,5)}`}
                      className={`mb-4 ${m.isAI ? 'text-left' : 'text-right'}`}
                    >
                      <div
                        className={`transform transition-all duration-200 will-change-transform ${
                          m.isAI 
                            ? 'chat-message-ai' 
                            : 'chat-message-user'
                        } px-4 py-3`}
                        style={{ transform: 'translateZ(0)' }}
                      >
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="text-left mb-4 animate-fade-in">
                      <div className="chat-message-ai px-6 py-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-exam-highlight rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-exam-highlight rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-exam-highlight rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#3c6e47]/10 pt-4">
                <input
                  className="w-full px-4 py-3 text-[#3c6e47] bg-white border border-[#3c6e47]/20
                           rounded-lg focus:outline-none focus:border-[#3c6e47] transition-all duration-200"
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
                <div className="flex flex-row sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={submitAnswer}
                    disabled={isLoading || !userAnswer.trim()}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-[#3c6e47] hover:bg-[#98c3a4] text-white rounded-lg
                             transition-all duration-200 disabled:opacity-50 min-w-[100px]"
                  >
                    Send
                  </button>
                  <button
                    onClick={finalizeExam}
                    disabled={isLoading || messages.length < 2}
                    className="flex-1 sm:flex-initial px-6 py-3 bg-[#3c6e47]/60 hover:bg-[#3c6e47]/80 text-white rounded-lg
                             transition-all duration-200 disabled:opacity-50 min-w-[100px]"
                  >
                    Finish
                  </button>
                </div>
      
              </div>
              
              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
      </main>
    </div>
  );
}
