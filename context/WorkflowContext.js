import { createContext, useContext, useState } from 'react';

const WorkflowContext = createContext({
	activePlanId: null,
	activeExamId: null,
	activeChatId: null,
	setActivePlanId: () => {},
	setActiveExamId: () => {},
	setActiveChatId: () => {},
	clearWorkflow: () => {},
});

export function WorkflowProvider({ children }) {
	const [activePlanId, setActivePlanId] = useState(null);
	const [activeExamId, setActiveExamId] = useState(null);
	const [activeChatId, setActiveChatId] = useState(null);

	const clearWorkflow = () => {
		setActivePlanId(null);
		setActiveExamId(null);
		setActiveChatId(null);
	};

	return (
		<WorkflowContext.Provider
			value={{
				activePlanId,
				activeExamId,
				activeChatId,
				setActivePlanId,
				setActiveExamId,
				setActiveChatId,
				clearWorkflow,
			}}
		>
			{children}
		</WorkflowContext.Provider>
	);
}

export const useWorkflow = () => {
	const context = useContext(WorkflowContext);
	if (context === undefined) {
		throw new Error('useWorkflow must be used within a WorkflowProvider');
	}
	return context;
};