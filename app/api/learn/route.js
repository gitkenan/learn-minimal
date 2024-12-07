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
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      const planContent = await generateLearningPlan(topic);
      
      if (!planContent) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate plan content' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
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
        } catch (redisError) {
          console.error('Redis error:', redisError);
          // Continue even if Redis fails - we can still return the plan
        }
      }

      return new Response(JSON.stringify(planObj), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      return new Response(
        JSON.stringify({ 
          error: error.message || 'An error occurred while generating the plan',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }),
        { 
          status: error.message?.includes('timed out') ? 503 : 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in learn route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate learning plan' }),
      { status: 500 }
    );
  }
}
