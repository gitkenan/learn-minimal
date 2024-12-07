// lib/ai-client.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateLearningPlan(topic) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw new Error('Failed to generate plan. Please try again.');
  }
}

export async function expandSnippet(snippet) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Provide a clear, concise explanation.'
        },
        {
          role: 'user',
          content: `Explain this: ${snippet}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error expanding snippet:', error);
    throw new Error('Failed to expand content. Please try again.');
  }
}

export async function improveSnippet(original, feedback) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Improve the content based on user feedback while maintaining clarity.'
        },
        {
          role: 'user',
          content: `Original: ${original}\nFeedback: ${feedback}\nPlease improve this content.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error improving content:', error);
    throw new Error('Failed to improve content. Please try again.');
  }
}