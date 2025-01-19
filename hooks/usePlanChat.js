import { useRouter } from 'next/router';
import { useWorkflow } from '@/context/WorkflowContext';

export function usePlanChat() {
	const router = useRouter();
	const { activePlanId } = useWorkflow();

	const startChatFromPlan = async (plan) => {
		if (!plan?.sections) return;

		// Extract topics from plan sections for context
		const topics = plan.sections
			.map(section => section.title)
			.join(', ');

		// Store chat configuration
		const chatConfig = {
			initialContext: `This chat is about a learning plan covering: ${topics}`,
			planId: activePlanId,
			topics
		};

		// Store in localStorage for chat page
		localStorage.setItem('chatConfig', JSON.stringify(chatConfig));
		
		// Navigate to chat page
		router.push('/chat');
	};

	return { startChatFromPlan };
}