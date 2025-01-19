import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		const supabase = createPagesServerClient({ req, res });
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return res.status(401).json({ message: 'Unauthorized' });
		}

		const { prompt, messages } = req.body;

		// Initialize AI model
		const model = genAI.getGenerativeModel({ 
			model: "gemini-pro",
			safetySettings: [
				{
					category: "HARM_CATEGORY_HARASSMENT",
					threshold: "BLOCK_NONE"
				},
				{
					category: "HARM_CATEGORY_HATE_SPEECH",
					threshold: "BLOCK_NONE"
				},
				{
					category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
					threshold: "BLOCK_NONE"
				},
				{
					category: "HARM_CATEGORY_DANGEROUS_CONTENT",
					threshold: "BLOCK_NONE"
				}
			]
		});

		// Create initial prompt for AI examiner
		const initialPrompt = {
			role: "user",
			parts: [{
				text: `You are an AI examiner. Your role is to:
1. Ask clear, focused questions
2. Provide constructive feedback on answers
3. Maintain the specified difficulty level
4. Keep questions relevant to the subject matter
5. Provide detailed explanations when giving feedback
6. Ask follow-up questions that build on previous answers
7. End with a comprehensive evaluation

Remember to:
- Stay focused on the specified subject
- Keep the difficulty level consistent
- Provide encouraging but honest feedback
- Give detailed explanations for correct and incorrect parts of answers

Now, proceed with the examination as specified in the following prompt:

${prompt}`
			}]
		};

		// Create chat history including initial prompt
		const history = messages ? [
			initialPrompt,
			...messages.map(msg => ({
				role: msg.isAI ? "model" : "user",
				parts: [{ text: msg.text }]
			}))
		] : [initialPrompt];

		const chat = model.startChat({
			history: history
		});

		const result = await chat.sendMessage([{ text: prompt }]);
		
		if (!result || !result.response) {
			return res.status(502).json({ 
				error: 'Invalid AI response format',
				details: 'The AI returned an invalid response format'
			});
		}

		const responseText = result.response.text();
		if (!responseText || typeof responseText !== 'string') {
			return res.status(502).json({ 
				error: 'Empty or invalid AI response',
				details: 'The AI returned an empty or invalid response'
			});
		}

		return res.status(200).json({ response: responseText });
	} catch (error) {
		console.error('Exam API Error:', error);
		
		if (error.message.includes('SAFETY')) {
			return res.status(403).json({ 
				error: 'Message blocked by content safety filters',
				details: process.env.NODE_ENV === 'development' ? error.message : undefined
			});
		}

		return res.status(500).json({ 
			message: 'Internal server error',
			error: error.message 
		});
	}
}