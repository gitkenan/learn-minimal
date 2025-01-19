import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkflow } from '@/context/WorkflowContext';
import LearningChat from '@/components/LearningChat';
import Header from '@/components/Header';

export default function ChatPage() {
	const { user } = useAuth();
	const { activePlanId } = useWorkflow();
	const [chatConfig, setChatConfig] = useState(null);

	useEffect(() => {
		// Load chat configuration if coming from a plan
		const storedConfig = localStorage.getItem('chatConfig');
		if (storedConfig) {
			const config = JSON.parse(storedConfig);
			setChatConfig(config);
			localStorage.removeItem('chatConfig');
		}
	}, []);

	if (!user) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<p>Please sign in to access the chat.</p>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<div className="bg-white rounded-lg shadow-lg h-[calc(100vh-12rem)]">
					<LearningChat 
						planId={chatConfig?.planId || activePlanId} 
						topic={chatConfig?.topics || ''} 
					/>
				</div>
			</main>
		</div>
	);
}