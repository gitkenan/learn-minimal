// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { redis } from '../../../lib/redis';
import { generateLearningPlan } from '../../../lib/ai-client';

export async function POST(req) {
  try {
    const auth = getAuth(req);
    const userId = auth.userId || null;

    const { topic } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid topic provided' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate the plan using our abstracted AI client
    const planContent = await generateLearningPlan(topic);

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
      return new Response(JSON.stringify({ plan: planContent, planId }), { status: 200 });
    } else {
      // For unauthenticated users, just return the plan without saving
      return new Response(JSON.stringify({ plan: planContent }), { status: 200 });
    }
  } catch (error) {
    console.error('Error in POST request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      }), 
      { status: 500 }
    );
  }
}
