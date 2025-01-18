import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { initializeSupabase } from '../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

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
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to access the AI Examiner</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {!showQuiz && (
        <div className="max-w-xl mx-auto my-12 p-4 border rounded shadow">
          <h1 className="text-xl font-semibold mb-4">AI Examiner Setup</h1>
          <input
            placeholder="Subject"
            className="w-full border p-2 mb-3"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <input
            placeholder="Experience (optional)"
            className="w-full border p-2 mb-3"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
          <select
            className="w-full border p-2 mb-3"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            className="w-full border p-2 mb-3"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
          >
            <option value="short-answer">Short-Answer</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="essay">Essay</option>
          </select>
          <button 
            onClick={startQuiz} 
            className="px-4 py-2 bg-green-600 text-white rounded interactive"
          >
            Start Exam
          </button>
        </div>
      )}

      {showQuiz && (
        <div className="flex-1 max-w-2xl mx-auto w-full p-4">
          <div ref={chatRef} className="border rounded p-4 h-96 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`mb-2 ${m.isAI ? 'text-left' : 'text-right'}`}>
                <div
                  className={`inline-block px-3 py-2 rounded-md ${m.isAI ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
                >
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 border p-2 rounded"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer..."
            />
            <button 
              onClick={submitAnswer} 
              className="px-4 py-2 bg-blue-600 text-white rounded interactive"
            >
              Send
            </button>
            <button 
              onClick={finalizeExam} 
              className="px-4 py-2 bg-gray-400 text-white rounded interactive"
            >
              Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
