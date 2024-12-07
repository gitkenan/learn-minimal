// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { redis } from '../../../lib/redis';
import { generateLearningPlan } from '../../../lib/ai-client';

export async function POST(req) {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;

    const body = await req.json();
    const { topic } = body;

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400 }
      );
    }

    const planContent = await generateLearningPlan(topic);
    
    if (!planContent) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate plan content' }),
        { status: 500 }
      );
    }

    // Generate a plan ID regardless of authentication status
    const planId = `plan:${Date.now()}`;

    // Create base plan object with consistent structure
    const planObj = {
      id: planId,
      topic,
      content: planContent,
      createdAt: new Date().toISOString()
    };

    // Add additional fields and save to Redis only for authenticated users
    if (userId) {
      const authenticatedPlan = {
        ...planObj,
        progress: {}
      };

      try {
        await redis.hset(`user:${userId}:plans`, {
          [planId]: JSON.stringify(authenticatedPlan)
        });
        return new Response(
          JSON.stringify({ plan: authenticatedPlan }),
          { status: 200 }
        );
      } catch (redisError) {
        console.error('Redis save error:', redisError);
        // Still return the plan even if saving fails
        return new Response(
          JSON.stringify({ 
            plan: authenticatedPlan,
            warning: 'Plan generated but failed to save'
          }),
          { status: 200 }
        );
      }
    }

    // Return plan with consistent structure for unauthenticated users
    return new Response(
      JSON.stringify({ plan: planObj }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in learn route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate learning plan' }),
      { status: 500 }
    );
  }
}
