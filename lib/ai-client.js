// lib/ai-client.js
import OpenAI from 'openai';

const NVIDIA_MODEL_ID = 'ibm/granite-3.0-8b-instruct';

if (!process.env.NVIDIA_API_KEY) {
  throw new Error('NVIDIA_API_KEY is required');
}

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

export async function generateLearningPlan(topic) {
  try {
    const completion = await openai.chat.completions.create({
      model: NVIDIA_MODEL_ID,
      messages: [
        {
          role: 'system',
          content: 'Create a simple learning plan with 3-5 main points. Keep descriptions brief.'
        },
        {
          role: 'user',
          content: `Create a learning plan for: ${topic}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = completion.choices[0].message.content;
    if (!result) throw new Error('No content generated');
    return result;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw new Error('Failed to generate learning plan');
  }
}