import { useRouter } from 'next/router';
import { useWorkflow } from '@/context/WorkflowContext';

export function useExamFromPlan() {
	const router = useRouter();
	const { activePlanId } = useWorkflow();

	const startExamFromPlan = async (plan, sectionId = null, itemId = null) => {
		if (!plan?.sections) return;

		let subject, systemInstructions;
		
		if (sectionId) {
			const section = plan.sections.find(s => s.id === sectionId);
			if (!section) return;

			if (itemId) {
				const item = section.items.find(i => i.id === itemId);
				if (!item) return;
				subject = `${section.title} - ${item.content}`;
				systemInstructions = `This exam should test knowledge specifically about: ${item.content} from section "${section.title}"`;
			} else {
				subject = section.title;
				systemInstructions = `This exam should test knowledge from the section: ${section.title}`;
			}
		} else {
			// Original behavior for full plan
			subject = plan.sections.map(section => section.title).join(', ');
			systemInstructions = `This exam should test knowledge from the following learning plan sections: ${subject}`;
		}

		const examConfig = {
			subject,
			difficulty: 'medium',
			questionType: 'short-answer',
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