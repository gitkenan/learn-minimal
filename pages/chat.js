import { useAuth } from '@/context/AuthContext';
import { useWorkflow } from '@/context/WorkflowContext';
import { useRouter } from 'next/router';
import LearningChat from '@/components/LearningChat';
import Header from '@/components/Header';

export default function ChatPage() {
	const { user } = useAuth();
	const { activePlanId } = useWorkflow();
	const router = useRouter();
	const { planId, topics, context } = router.query;

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
						planId={planId || activePlanId} 
						topic={topics || ''} 
						initialContext={context}
					/>
				</div>
			</main>
		</div>
	);
}
