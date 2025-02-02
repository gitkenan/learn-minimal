// pages/chat.js
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import { useGoogleChat } from '@/hooks/useGoogleChat';
import { ThumbsUp, RotateCcw } from 'lucide-react'; // Import icons we'll use

export default function ChatPage() {
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [inputMessage, setInputMessage] = useState('');
    const [error, setError] = useState(null);
    const { messages, isLoading, error: chatError, sendMessage, resetChat } = useGoogleChat();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        const userInput = inputMessage.trim();
        setInputMessage('');

        await sendMessage(
            userInput,
            "Writing in the style of George Orwell, " + 
            "teaching the user who is your student. " +
            "providing no titles or subtitles in your answer, " +
            "provide authentic information as a response to the student's questions."
        );
    };

    return (
        <div className="flex flex-col flex-1 bg-[#1a2b23] relative">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.isAI ? 'justify-start' : 'justify-end'} max-w-3xl mx-auto w-full`}
                    >
                        {message.isAI ? (
                            <div className="flex items-start space-x-3 max-w-[85%]">
                                <div className="h-8 w-8 rounded-full bg-[#1d332b] flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm">AI</span>
                                </div>
                                <div className="text-gray-100">
                                    <p className="text-pretty leading-relaxed">{message.content}</p>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex space-x-2 mt-2">
                                        <button className="p-1.5 hover:bg-[#2a3d33] rounded-md transition-colors">
                                            <ThumbsUp size={16} className="text-gray-400" />
                                        </button>
                                        <button className="p-1.5 hover:bg-[#2a3d33] rounded-md transition-colors">
                                            <RotateCcw size={16} className="text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-[85%]">
                                <div className="bg-[#1d332b] rounded-2xl p-4 text-white">
                                    <p className="text-pretty leading-relaxed">{message.content}</p>
                                    <div className="text-xs text-[#8abf9e] mt-1">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button className="p-1.5 hover:bg-[#2a3d33] rounded-md transition-colors">
                                        <ThumbsUp size={16} className="text-gray-400" />
                                    </button>
                                    <button className="p-1.5 hover:bg-[#2a3d33] rounded-md transition-colors">
                                        <RotateCcw size={16} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 bg-[#1a2b23] z-10 border-t border-[#2a3d33]">
                <div className="p-4 max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            placeholder="Message AI"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            disabled={isLoading}
                            className="w-full py-3 px-4 !bg-[#2a3d33] text-white rounded-full
             placeholder-gray-400 border border-[#2a3d33]
             focus:border-[#2a3d33] focus:ring-1 focus:ring-[#2a3d33]
             disabled:opacity-50 transition-all duration-200
             focus:outline-none"
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}