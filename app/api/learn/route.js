// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { redis } from '../../../lib/redis';
import { generateLearningPlan } from '../../../lib/ai-client';

export async function POST(request) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { userId } = getAuth(request);
    const plan = await generateLearningPlan(topic);

    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate plan' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For authenticated users, include plan ID for later retrieval
    if (userId) {
      const planId = `plan:${Date.now()}`;
      const planObj = {
        id: planId,
        topic,
        content: plan,
        createdAt: new Date().toISOString()
      };

      // Don't block on Redis - fire and forget
      redis.hset(`user:${userId}:plans`, {
        [planId]: JSON.stringify(planObj)
      }).catch(error => {
        console.error('Redis error (non-blocking):', error);
      });

      return new Response(
        JSON.stringify({ plan: planObj }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For unauthenticated users, just return the plan content
    return new Response(
      JSON.stringify({ plan: { content: plan, topic } }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in learn route:', error);
    const errorMessage = error.message === 'The request took too long. Please try again with a simpler topic.' 
      ? error.message 
      : 'Failed to generate learning plan';
      
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: error.message.includes('too long') ? 408 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
