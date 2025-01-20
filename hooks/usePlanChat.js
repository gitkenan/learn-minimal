import { useRouter } from 'next/router';
import { useWorkflow } from '@/context/WorkflowContext';
import { useChat } from '@/hooks/useChat';

export function usePlanChat() {
	const router = useRouter();
	const { activePlanId } = useWorkflow();
	
	const startChatFromPlan = async (plan) => {
		if (!plan?.sections) return;

		// Extract topics from plan sections for context
		const topics = plan.sections
			.map(section => section.title)
			.join(', ');

		// Navigate to chat page with query params
		router.push({
			pathname: '/chat',
			query: {
				planId: activePlanId,
				topics,
				context: `This chat is about a learning plan covering: ${topics}`
			}
		});
	};

	return { startChatFromPlan };
}
