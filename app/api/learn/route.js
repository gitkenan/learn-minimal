// app/api/learn/route.js
import OpenAI from 'openai';
import { getAuth } from '@clerk/nextjs/server';
import { redis } from '../../../lib/redis';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { topic } = await req.json();
    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.2-3b-instruct',
      messages: [{ role: 'user', content: `Create a learning plan for: ${topic}` }],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const planContent = completion.choices[0]?.message?.content || 'No plan generated.';
    const planId = `plan:${Date.now()}`;

    console.log(`Saving plan with ID: ${planId} for user: ${userId}`);

    // Ensure the entire plan is stringified
    const planData = JSON.stringify({
      id: planId,
      topic,
      content: planContent,
      progress: {}, // Initialize empty progress
    });

    // Save the plan to Redis
    await redis.hset(`user:${userId}:plans`, {
      [planId]: planData,
    });

    console.log(`Plan saved successfully with ID: ${planId}`);

    return new Response(JSON.stringify({ plan: planContent, planId }), { status: 200 });
  } catch (error) {
    console.error('Error in POST request:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
