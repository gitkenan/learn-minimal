import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleApiError } from '../../utils/apiUtils';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return handleApiError(res, {
			statusCode: 405,
			type: 'METHOD_NOT_ALLOWED',
			message: 'Method not allowed'
		}, 'Method not allowed');
	}

	try {
		const authToken = req.headers['x-supabase-auth'];
		if (!authToken) {
			console.error('No auth token found in request headers');
			return handleApiError(res, {
				statusCode: 401,
				type: 'UNAUTHORIZED',
				message: 'Authentication required'
			}, 'Authentication required');
		}

		const supabase = createPagesServerClient({ req, res });
		// Refresh session before long-running operation
		const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
		if (refreshError || !session?.user) {
			console.error('Session refresh error:', refreshError);
			return handleApiError(res, {
				statusCode: 401,
				type: 'SESSION_EXPIRED',
				message: 'Session expired - please refresh the page'
			}, 'Session refresh failed');
		}

		// Setup session keep-alive
		let keepAliveInterval = setInterval(async () => {
			try {
				await supabase.auth.refreshSession();
			} catch (error) {
				console.error('Keep-alive refresh failed:', error);
			}
		}, 30000); // Refresh every 30 seconds

		const { prompt, messages } = req.body;
		let aiResponse = null;

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
				text: `You are a helpful examiner. Your role is to:
1. Ask clear, focused questions, one at a time
2. Maintain the specified difficulty level
3. Keep questions relevant to the subject matter
4. Do not ever include illustrations or pictures in your questions. Instead, describe any necessary content with a detailed description.

Remember to:
- Stay focused on the specified subject
- Keep the difficulty level consistent

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

		try {
			const result = await chat.sendMessage([{ text: prompt }]);
			
			if (!result?.response) {
				throw new Error('AI response format invalid');
			}

			aiResponse = result.response.text();
		} finally {
			clearInterval(keepAliveInterval);
		}

		if (!aiResponse) {
			return handleApiError(res, {
				statusCode: 502,
				type: 'AI_SERVICE_UNAVAILABLE',
				message: 'AI service unavailable - try again later'
			}, 'Empty AI response');
		}
		if (!responseText || typeof responseText !== 'string') {
			return handleApiError(res, {
				statusCode: 502,
				type: 'AI_RESPONSE_CONTENT_ERROR',
				message: 'The AI returned an empty or invalid response'
			}, 'Empty or invalid AI response');
		}

		return res.status(200).json({
			response: aiResponse,
			session: { // Return fresh session details
				access_token: session.access_token,
				expires_at: session.expires_at
			}
		});
	} catch (error) {
		console.error('Exam API Error:', error);
		
		if (error.message.includes('SAFETY')) {
			return handleApiError(res, {
				statusCode: 403,
				type: 'CONTENT_SAFETY_ERROR',
				message: 'Message blocked by content safety filters'
			}, 'Content safety error');
		}

		return handleApiError(res, error, 'Internal server error');
	}
}