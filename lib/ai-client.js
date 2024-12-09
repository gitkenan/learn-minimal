import OpenAI from 'openai';

const AI_CONFIGS = {
  nvidia: {
    client: OpenAI,
    config: {
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      defaultHeaders: { 'Content-Type': 'application/json' },
      timeout: 15000, // 15 second timeout
    },
    defaultModel: 'ibm/granite-3.0-8b-instruct',
  },
  openai: {
    client: OpenAI,
    config: {
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000, // 15 second timeout
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
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting plan generation for topic:`, topic);
  console.log(`[${new Date().toISOString()}] Using AI provider:`, currentProvider);
  console.log(`[${new Date().toISOString()}] Using model:`, config.defaultModel);

  const messages = [
    {
      role: 'system',
      content: 'You are a learning assistant. Create very concise learning plans. Use 3-5 main points maximum, with brief descriptions. Format as a simple numbered list.',
    },
    {
      role: 'user',
      content: `Create a brief learning plan for: ${topic}. Keep it simple and short.`,
    },
  ];

  try {
    console.log(`[${new Date().toISOString()}] Initiating AI request`);
    
    // Create a timeout promise - increased to 15 seconds
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        console.log(`[${new Date().toISOString()}] Request timed out after 15 seconds`);
        reject(new Error('AI request timed out after 15 seconds'));
      }, 15000);
    });

    // Create the AI completion promise with reduced tokens
    const aiPromise = aiClient.chat.completions.create({
      model: config.defaultModel,
      messages,
      temperature: 0.3,
      top_p: 0.8,
      max_tokens: 200, // Further reduced token count
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    }).then(result => {
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] AI request completed in ${duration}ms`);
      return result;
    });

    // Race between the timeout and the AI completion
    const completion = await Promise.race([aiPromise, timeout]);

    if (!completion?.choices?.[0]?.message?.content) {
      console.log(`[${new Date().toISOString()}] Invalid response format received:`, completion);
      throw new Error('Invalid response format from AI provider');
    }

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Successfully generated plan in ${duration}ms`);
    return completion.choices[0].message.content;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error generating learning plan after ${duration}ms:`, error.message);
    console.error('Full error:', error);
    
    // More specific error messages
    if (error.message.includes('timed out')) {
      throw new Error('The request took too long to complete. Please try again.');
    } else if (error.message.includes('api_key')) {
      console.error('API key error details:', error);
      throw new Error('API key configuration error. Please check your environment variables.');
    } else if (error.message.includes('Invalid response format')) {
      throw new Error('Received invalid response from AI service. Please try again.');
    } else if (error.response) {
      console.error('API response error:', error.response.data);
      throw new Error(`API error: ${error.response.data?.error?.message || error.message}`);
    }
    
    throw new Error(`Failed to generate learning plan: ${error.message}`);
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
