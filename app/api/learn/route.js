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
    const auth = getAuth(req);
    const userId = auth.userId || null;

    const { topic } = await req.json();

    // Generate the plan using the AI model
    const completion = await openai.chat.completions.create({
      model: 'ibm/granite-3.0-8b-instruct',
      messages: [{ role: 'user', content: `Create a learning plan for: ${topic}` }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 2048,
    });

    const planContent = completion.choices[0]?.message?.content || 'No plan generated.';

    // Save the plan only if the user is authenticated
    if (userId) {
      const planId = `plan:${Date.now()}`;

      console.log(`Saving plan with ID: ${planId} for user: ${userId}`);

      // Save the plan to Redis
      await redis.hset(`user:${userId}:plans`, {
        [planId]: JSON.stringify({
          id: planId,
          topic,
          content: planContent,
          progress: {}, // Initialize empty progress
        }),
      });

      console.log(`Plan saved successfully with ID: ${planId}`);

      // Include planId in the response
      return new Response(JSON.stringify({ plan: planContent, planId }), { status: 200 });
    } else {
      // For unauthenticated users, just return the plan without saving
      return new Response(JSON.stringify({ plan: planContent }), { status: 200 });
    }
  } catch (error) {
    console.error('Error in POST request:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
