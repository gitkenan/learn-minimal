import { useState, useEffect } from 'react';
import { initializeSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export function useChat({ discussionId, planId, topics, initialContext } = {}) {
	const { user } = useAuth();
	const [discussions, setDiscussions] = useState([]);
	const [currentDiscussion, setCurrentDiscussion] = useState(null);
	const [messages, setMessages] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);
	const [error, setError] = useState(null);

	// Load discussions for plan-based chat
	useEffect(() => {
		const loadDiscussions = async () => {
			if (!planId || !user || discussionId) return;
			
			try {
				const supabase = initializeSupabase();
				const { data, error } = await supabase
					.from('plan_discussions')
					.select('*')
					.eq('plan_id', planId)
					.eq('user_id', user.id)
					.order('created_at', { ascending: false });

				if (error) throw error;
				
				setDiscussions(data || []);
				setIsInitializing(false);

			} catch (err) {
				console.error('Error loading discussions:', err);
				setError('Failed to load chat history');
				setIsInitializing(false);
			}
		};

		loadDiscussions();
	}, [planId, user, discussionId]);

	// Load single discussion for discussion-based chat
	useEffect(() => {
		const loadDiscussion = async () => {
			if (!discussionId || !user) return;
			
			try {
				const supabase = initializeSupabase();
				const { data, error } = await supabase
					.from('plan_discussions')
					.select('*')
					.eq('id', discussionId)
					.single();

				if (error) throw error;
				setCurrentDiscussion(data);
				setIsInitializing(false);
			} catch (err) {
				console.error('Error loading discussion:', err);
				setError('Failed to load chat');
				setIsInitializing(false);
			}
		};

		loadDiscussion();
	}, [discussionId, user]);

	// Load messages for current discussion
	useEffect(() => {
		const loadMessages = async () => {
			if (!currentDiscussion) {
				setMessages([]);
				return;
			}

			try {
				const supabase = initializeSupabase();
				const { data, error } = await supabase
					.from('discussion_messages')
					.select('*')
					.eq('discussion_id', currentDiscussion.id)
					.order('created_at', { ascending: true });

				if (error) throw error;
				setMessages(data || []);
			} catch (err) {
				console.error('Error loading messages:', err);
				setError('Failed to load messages');
			}
		};

		loadMessages();
	}, [currentDiscussion]);

	const startNewDiscussion = async () => {
		if (!planId || !user) return;
		
		try {
			const supabase = initializeSupabase();
			const title = `Chat ${discussions.length + 1}`;
			
			const { data, error } = await supabase
				.from('plan_discussions')
				.insert([{
					plan_id: planId,
					user_id: user.id,
					title,
					is_active: true,
					context: initialContext
				}])
				.select()
				.single();

			if (error) throw error;

			setDiscussions(prev => [data, ...prev]);
			setCurrentDiscussion(data);
			setMessages([]);
			setError(null);
		} catch (err) {
			console.error('Error creating discussion:', err);
			setError('Failed to start new chat');
		}
	};

	const sendMessage = async (content) => {
		if (!content.trim() || !currentDiscussion) return;
		setIsLoading(true);
		setError(null);

		try {
			const supabase = initializeSupabase();
			
			// Add user message
			const { data: userMessage, error: messageError } = await supabase
				.from('discussion_messages')
				.insert({
					discussion_id: currentDiscussion.id,
					content,
					is_ai: false
				})
				.select()
				.single();

			if (messageError) throw messageError;
			setMessages(prev => [...prev, userMessage]);

			// Get AI response
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: content,
					topic: topics,
					discussionId: currentDiscussion.id,
					planId,
					context: currentDiscussion.context || initialContext
				})
			});

			if (!response.ok) throw new Error('Failed to get AI response');
			const data = await response.json();

			// Save AI response
			const { data: aiMessage, error: aiError } = await supabase
				.from('discussion_messages')
				.insert({
					discussion_id: currentDiscussion.id,
					content: data.response,
					is_ai: true
				})
				.select()
				.single();

			if (aiError) throw aiError;
			setMessages(prev => [...prev, aiMessage]);
		} catch (err) {
			console.error('Error in chat:', err);
			setError('Failed to send message. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return {
		discussions,
		currentDiscussion,
		messages,
		isLoading,
		isInitializing,
		error,
		startNewDiscussion,
		sendMessage,
		setCurrentDiscussion
	};
}