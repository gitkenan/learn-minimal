import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

export async function generateLearningPlan(topic) {
  const completion = await openai.chat.completions.create({
    model: 'ibm/granite-3.0-8b-instruct',
    messages: [
      { role: 'system', content: 'Create a simple learning plan with 3-5 main points.' },
      { role: 'user', content: `Create a learning plan for: ${topic}` }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return completion.choices[0].message.content;
}
