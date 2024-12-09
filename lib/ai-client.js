import OpenAI from 'openai';

// Configuration for different AI providers
const AI_CONFIGS = {
  nvidia: {
    client: OpenAI,
    config: {
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
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

// Get the current AI provider from environment variables
const currentProvider = process.env.AI_PROVIDER || 'nvidia';

if (!AI_CONFIGS[currentProvider]) {
  throw new Error(`Invalid AI provider: ${currentProvider}`);
}

// Initialize the AI client based on the current provider
const config = AI_CONFIGS[currentProvider];
const aiClient = new config.client(config.config);

// Helper function to generate learning plans
export async function generateLearningPlan(topic) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful learning assistant that creates structured learning plans. Format your response in clear sections with bullet points.'
    },
    {
      role: 'user',
      content: `Create a detailed learning plan for: ${topic}. Include clear steps, resources, and estimated time frames.`
    }
  ];

  const completion = await aiClient.chat.completions.create({
    model: config.defaultModel,
    messages,
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 2048,
  });

  if (!completion.choices?.[0]?.message?.content) {
    throw new Error('No plan content generated from the API');
  }

  return completion.choices[0].message.content;
}

export async function expandSnippet(snippet) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Expand and provide more information about the given snippet. Keep it factual and detailed.'
    },
    {
      role: 'user',
      content: `Expand on the following snippet in detail: ${snippet}`
    }
  ];

  const completion = await aiClient.chat.completions.create({
    model: config.defaultModel,
    messages,
    temperature: 0.3,
    top_p: 0.7,
    max_tokens: 1024,
  });

  if (!completion.choices?.[0]?.message?.content) {
    throw new Error('No expanded content generated');
  }

  return completion.choices[0].message.content;
}

export async function improveSnippet(original, feedback) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. The user is not satisfied with the provided snippet. Use the user\'s feedback to improve and clarify the snippet. Maintain factual accuracy.'
    },
    {
      role: 'user',
      content: `Original snippet: ${original}\nUser feedback: ${feedback}\nPlease rewrite the snippet incorporating the user feedback and improving clarity and usefulness.`
    }
  ];

  const completion = await aiClient.chat.completions.create({
    model: config.defaultModel,
    messages,
    temperature: 0.3,
    top_p: 0.7,
    max_tokens: 1024,
  });

  if (!completion.choices?.[0]?.message?.content) {
    throw new Error('No improved content generated');
  }

  return completion.choices[0].message.content;
}
