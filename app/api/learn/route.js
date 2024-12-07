// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { generateLearningPlan } from '../../../lib/ai-client';
import { redis } from '../../../lib/redis';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Check authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    const planContent = await generateLearningPlan(topic);

    if (!planContent) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate plan' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate a unique ID for the plan
    const planId = uuidv4();

    // Create the plan object
    const plan = {
      id: planId,
      topic,
      content: planContent,
      createdAt: new Date().toISOString(),
      progress: {}
    };

    // Store the plan in Redis under the user's plans
    await redis.hset(`user:${userId}:plans`, planId, JSON.stringify(plan));

    return new Response(
      JSON.stringify({ plan }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in learn route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate learning plan' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
