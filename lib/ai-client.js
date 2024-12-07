// lib/ai-client.js
import OpenAI from 'openai';

const NVIDIA_API_ENDPOINT = 'https://api.nvcf.nvidia.com/v2/chat/completions';
const NVIDIA_MODEL_ID = 'ibm/granite-3b-instruct';

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const OPENAI_MODEL = 'gpt-3.5-turbo';

// Initialize OpenAI client if needed
const openai = AI_PROVIDER === 'openai' ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

async function nvidiaChatCompletion(messages) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not found in environment variables');
  }

  try {
    const response = await fetch(NVIDIA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL_ID,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`NVIDIA API error: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling NVIDIA API:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
}

async function openaiChatCompletion(messages, maxTokens = 500) {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
}

async function chatCompletion(messages, maxTokens = 500) {
  switch (AI_PROVIDER.toLowerCase()) {
    case 'nvidia':
      return nvidiaChatCompletion(messages);
    case 'openai':
      return openaiChatCompletion(messages, maxTokens);
    default:
      throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
  }
}

export async function generateLearningPlan(topic) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'Create a simple learning plan with 3-5 main points. Keep descriptions brief.'
      },
      {
        role: 'user',
        content: `Create a learning plan for: ${topic}`
      }
    ];

    return await chatCompletion(messages, 500);
  } catch (error) {
    console.error('Error generating plan:', error);
    throw new Error('Failed to generate plan. Please try again.');
  }
}

export async function expandSnippet(snippet) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'Provide a clear, concise explanation.'
      },
      {
        role: 'user',
        content: `Explain this: ${snippet}`
      }
    ];

    return await chatCompletion(messages, 300);
  } catch (error) {
    console.error('Error expanding snippet:', error);
    throw new Error('Failed to expand content. Please try again.');
  }
}

export async function improveSnippet(original, feedback) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'Improve the given content based on user feedback.'
      },
      {
        role: 'user',
        content: `Original content: ${original}\nFeedback: ${feedback}\nPlease improve the content based on this feedback.`
      }
    ];

    return await chatCompletion(messages, 300);
  } catch (error) {
    console.error('Error improving snippet:', error);
    throw new Error('Failed to improve content. Please try again.');
  }
}