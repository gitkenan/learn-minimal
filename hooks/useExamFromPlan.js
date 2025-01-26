import { useRouter } from 'next/router';
import { useWorkflow } from '@/context/WorkflowContext';

export function useExamFromPlan() {
	const router = useRouter();
	const { activePlanId } = useWorkflow();

	const startExamFromPlan = async (plan, sectionId = null, itemId = null) => {
		if (!plan?.sections) return;
		
		// Get topic from plan object directly
		const planTopic = plan.topic || plan.json_content?.topic || plan.sections[0]?.title || 'Learning Plan';
		
		let subject, systemInstructions;
		
		if (sectionId) {
			const section = plan.sections.find(s => s.id === sectionId);
			if (!section) return;

			if (itemId) {
				const item = section.items.find(i => i.id === itemId);
				if (!item) return;
				subject = `${planTopic} - ${section.title} - ${item.content}`;
				systemInstructions = `This exam should test knowledge specifically about: ${item.content} from section "${section.title}"`;
			} else {
				subject = `${planTopic} - ${section.title}`;
				systemInstructions = `This exam should test knowledge from the section: ${section.title}`;
			}
		} else {
			// Original behavior for full plan
			subject = planTopic;
			systemInstructions = `This exam should test knowledge from the following learning plan sections: ${plan.sections.map(section => section.title).join(', ')}`;
		}

		const examConfig = {
			subject,
			difficulty: 'medium',
			systemInstructions,
			planId: activePlanId,
			sectionId,
			itemId
		};

		localStorage.setItem('examConfig', JSON.stringify(examConfig));
		router.push('/exam');
	};

	return { startExamFromPlan };
}