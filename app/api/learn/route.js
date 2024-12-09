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

        return new Response(JSON.stringify({ plan: authenticatedPlan }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Return plan with consistent structure for unauthenticated users
      return new Response(JSON.stringify({ plan: planObj }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      
      // Handle different types of errors
      let status = 500;
      let message = 'An error occurred while generating the plan';
      
      if (error.message?.includes('timed out')) {
        status = 503;
        message = 'The request took too long. Please try again with a simpler topic.';
      } else if (error.message?.includes('rate limit') || error.status === 429) {
        status = 429;
        message = 'Too many requests. Please wait a moment and try again.';
      }

      return new Response(
        JSON.stringify({ 
          error: message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }),
        { 
          status,
          headers: { 
            'Content-Type': 'application/json',
            ...(status === 429 && { 'Retry-After': '30' }) // Suggest waiting 30 seconds
          }
        }
      );
    }
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
