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
    console.log('Generating plan for topic:', topic);

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let planContent;
    try {
      planContent = await generateLearningPlan(topic);
    } catch (error) {
      console.error('Plan generation failed:', error.message);
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Failed to generate plan',
          details: 'The AI service was unable to generate a plan. Please try again.' 
        }), 
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!planContent) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate plan',
          details: 'No plan content was generated. Please try again.' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate a unique ID for the plan
    const planId = uuidv4();

    // Create the plan object with consistent structure
    const plan = {
      id: planId,
      topic,
      content: planContent,
      createdAt: new Date().toISOString(),
      progress: {}
    };

    console.log('Saving plan to Redis:', { planId, topic });

    // Save the plan to Redis
    try {
      await redis.hset(`user:${userId}:plans`, planId, JSON.stringify(plan));
      console.log('Plan saved successfully');
    } catch (error) {
      console.error('Error saving plan to Redis:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save plan' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the plan with the consistent structure
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
