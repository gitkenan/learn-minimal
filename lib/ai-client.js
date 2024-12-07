import OpenAI from 'openai';

const AI_CONFIGS = {
  nvidia: {
    client: OpenAI,
    config: {
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      defaultHeaders: { 'Content-Type': 'application/json' },
    },
    defaultModel: 'ibm/granite-3.0-8b-instruct',
  },
  openai: {
    client: OpenAI,
    config: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    defaultModel: 'gpt-3.5-turbo',
  },
};

const currentProvider = process.env.AI_PROVIDER || 'nvidia';
if (!AI_CONFIGS[currentProvider]) {
  throw new Error(`Invalid AI provider: ${currentProvider}`);
}

const config = AI_CONFIGS[currentProvider];
const aiClient = new config.client(config.config);

export async function generateLearningPlan(topic) {
  console.log('Starting plan generation for topic:', topic);
  console.log('Using AI provider:', currentProvider);

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful learning assistant. Format the learning plan as a numbered list with bullet points (*) for actionable items. Keep responses concise, structured, and clear.',
    },
    {
      role: 'user',
      content: `Create a focused learning plan for: ${topic}. Format each step as a bullet point (*) if it's an actionable item. Include key steps and time frames.`,
    },
  ];

  try {
    // Create a timeout promise
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timed out after 8 seconds')), 8000);
    });

    // Create the AI completion promise
    const aiPromise = aiClient.chat.completions.create({
      model: config.defaultModel,
      messages,
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 512,
    });

    // Race between the timeout and the AI completion
    const completion = await Promise.race([aiPromise, timeout]);

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AI provider');
    }

    console.log('Successfully generated plan');
    return completion.choices[0].message.content;

  } catch (error) {
    console.error('Error generating learning plan:', error.message);
    if (error.message.includes('timed out')) {
      throw new Error('The request took too long to complete. Please try again.');
    }
    throw new Error('Failed to generate learning plan. Please try again later.');
  }
}

export async function expandSnippet(snippet) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Provide a concise explanation under 200 words.',
    },
    {
      role: 'user',
      content: `Explain this: ${snippet}`,
    },
  ];

  try {
    const completion = await aiClient.chat.completions.create({
      model: config.defaultModel,
      messages,
      temperature: 0.3,
      top_p: 0.7,
      max_tokens: 256,
      // No streaming
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('No expanded content generated');
    }

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in expandSnippet:', error);
    if (error.message.includes('timed out')) {
      throw new Error('Request took too long. Please try again.');
    }
    throw error;
  }
}

export async function improveSnippet(original, feedback) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Use the user feedback to improve clarity and usefulness.',
    },
    {
      role: 'user',
      content: `Original snippet: ${original}\nUser feedback: ${feedback}\nRewrite the snippet incorporating the feedback.`,
    },
  ];

  const completion = await aiClient.chat.completions.create({
    model: config.defaultModel,
    messages,
    temperature: 0.3,
    top_p: 0.7,
    max_tokens: 256,
    // No streaming
  });

  if (!completion.choices?.[0]?.message?.content) {
    throw new Error('No improved content generated');
  }

  return completion.choices[0].message.content;
}
