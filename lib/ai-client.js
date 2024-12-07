// lib/ai-client.js

const NVIDIA_API_ENDPOINT = 'https://api.nvcf.nvidia.com/v2/chat/completions';
const MODEL_ID = 'ibm/granite-3b-instruct';

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
        model: MODEL_ID,
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

export async function generateLearningPlan(topic) {
  try {
    const response = await nvidiaChatCompletion([
      {
        role: 'system',
        content: 'Create a simple learning plan with 3-5 main points. Keep descriptions brief.'
      },
      {
        role: 'user',
        content: `Create a learning plan for: ${topic}`
      }
    ]);

    return response;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw new Error('Failed to generate plan. Please try again.');
  }
}

export async function expandSnippet(snippet) {
  try {
    const response = await nvidiaChatCompletion([
      {
        role: 'system',
        content: 'Provide a clear, concise explanation.'
      },
      {
        role: 'user',
        content: `Explain this: ${snippet}`
      }
    ]);

    return response;
  } catch (error) {
    console.error('Error expanding snippet:', error);
    throw new Error('Failed to expand content. Please try again.');
  }
}

export async function improveSnippet(original, feedback) {
  try {
    const response = await nvidiaChatCompletion([
      {
        role: 'system',
        content: 'Improve the given content based on user feedback.'
      },
      {
        role: 'user',
        content: `Original content: ${original}\nFeedback: ${feedback}\nPlease improve the content based on this feedback.`
      }
    ]);

    return response;
  } catch (error) {
    console.error('Error improving snippet:', error);
    throw new Error('Failed to improve content. Please try again.');
  }
}