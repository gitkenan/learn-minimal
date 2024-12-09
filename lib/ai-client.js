// lib/ai-client.js
import OpenAI from 'openai';

const NVIDIA_API_ENDPOINT = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL_ID = 'ibm/granite-3b-instruct';

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const OPENAI_MODEL = 'gpt-3.5-turbo';

// Validate environment based on selected provider
if (!AI_PROVIDER) {
  console.warn('AI_PROVIDER not set, defaulting to OpenAI');
}

if (AI_PROVIDER === 'nvidia' && !process.env.NVIDIA_API_KEY) {
  throw new Error('NVIDIA_API_KEY is required when AI_PROVIDER is set to "nvidia"');
}

if (AI_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required when AI_PROVIDER is set to "openai"');
}

// Initialize OpenAI client if needed
const openai = AI_PROVIDER === 'openai' ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

async function nvidiaChatCompletion(messages) {
  try {
    const response = await fetch(NVIDIA_API_ENDPOINT + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL_ID,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      }),
    });

    let responseText;
    try {
      responseText = await response.text(); // Get raw response text first
      console.log('NVIDIA API raw response:', responseText);
      
      if (!response.ok) {
        let errorMessage;
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.message || 'Unknown error';
        } catch (e) {
          errorMessage = responseText || `HTTP error ${response.status}`;
        }
        throw new Error(`NVIDIA API error (${response.status}): ${errorMessage}`);
      }

      const data = JSON.parse(responseText);
      if (!data?.choices?.[0]?.message?.content) {
        console.error('Invalid NVIDIA API response format:', data);
        throw new Error('Invalid response format from NVIDIA API');
      }

      return data.choices[0].message.content;
    } catch (parseError) {
      console.error('NVIDIA API response parsing error:', {
        error: parseError,
        responseText,
        status: response.status
      });
      throw new Error(`Failed to parse NVIDIA API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error calling NVIDIA API:', error);
    throw error; // Let the caller handle the error
  }
}

async function openaiChatCompletion(messages, maxTokens = 500) {
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error; // Let the caller handle the error
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

    const result = await chatCompletion(messages, 500);
    if (!result) {
      throw new Error('No content generated from AI provider');
    }
    return result;
  } catch (error) {
    console.error(`Error generating plan with ${AI_PROVIDER}:`, error);
    throw new Error(`Failed to generate plan using ${AI_PROVIDER}: ${error.message}`);
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

    const result = await chatCompletion(messages, 300);
    if (!result) {
      throw new Error('No content generated from AI provider');
    }
    return result;
  } catch (error) {
    console.error(`Error expanding snippet with ${AI_PROVIDER}:`, error);
    throw new Error(`Failed to expand content using ${AI_PROVIDER}: ${error.message}`);
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

    const result = await chatCompletion(messages, 300);
    if (!result) {
      throw new Error('No content generated from AI provider');
    }
    return result;
  } catch (error) {
    console.error(`Error improving snippet with ${AI_PROVIDER}:`, error);
    throw new Error(`Failed to improve content using ${AI_PROVIDER}: ${error.message}`);
  }
}