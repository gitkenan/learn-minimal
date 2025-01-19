import { useRouter } from 'next/router';
import { useWorkflow } from '@/context/WorkflowContext';

export function useExamFromPlan() {
	const router = useRouter();
	const { activePlanId } = useWorkflow();

	const startExamFromPlan = async (plan) => {
		if (!plan?.sections) return;

		// Extract topics from plan sections
		const topics = plan.sections
			.map(section => section.title)
			.join(', ');

		// Store exam configuration
		const examConfig = {
			subject: topics,
			difficulty: 'medium',
			questionType: 'short-answer',
			systemInstructions: `This exam should test knowledge from the following learning plan sections: ${topics}`,
			planId: activePlanId
		};

		// Store in localStorage for exam page
		localStorage.setItem('examConfig', JSON.stringify(examConfig));
		
		// Navigate to exam page
		router.push('/exam');
	};

	return { startExamFromPlan };
}