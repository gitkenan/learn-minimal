import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, systemPrompt } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings: Object.values(HarmCategory).map(category => ({
        category,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      }))
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        }
      ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    res.status(200).json({ 
      response: response.text(),
      safetyMetadata: result.response?.safetyMetadata
    });

  } catch (error) {
    console.error('Google AI API error:', error);
    res.status(500).json({ 
      error: error.message || 'Error processing chat request',
      ...(error.response?.data ? { details: error.response.data } : {})
    });
  }
}
