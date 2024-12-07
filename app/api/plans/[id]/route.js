// app/api/plans/[id]/route.js
import { redis } from '../../../../lib/redis';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);
    const { id } = params;

    console.log('GET plan request:', { userId, planId: id });

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const decodedId = decodeURIComponent(id);
    console.log(`Retrieving plan with ID: ${decodedId} for user: ${userId}`);

    // Check if Redis is connected
    try {
      await redis.ping();
      console.log('Redis connection successful');
    } catch (error) {
      console.error('Redis connection error:', error);
      return new Response(JSON.stringify({ 
        error: 'Database connection error',
        details: 'Could not connect to the database'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const planData = await redis.hget(`user:${userId}:plans`, decodedId);
    
    if (!planData) {
      console.log('Plan not found in Redis:', { userId, decodedId });
      return new Response(JSON.stringify({ 
        error: 'Plan not found',
        details: 'The requested plan could not be found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Raw plan data from Redis:', planData);

    let plan;
    try {
      plan = typeof planData === 'string' ? JSON.parse(planData) : planData;
      
      // Validate plan structure
      if (!plan.id || !plan.content) {
        console.error('Invalid plan structure:', plan);
        throw new Error('Invalid plan structure');
      }

      // Initialize progress if it doesn't exist
      if (!plan.progress) {
        plan.progress = {};
      }

      console.log('Plan retrieved successfully:', { planId: plan.id, topic: plan.topic });
      
      return new Response(JSON.stringify({ 
        plan,
        message: 'Plan retrieved successfully'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error parsing plan data:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid plan data',
        details: 'The plan data is corrupted or invalid'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error retrieving plan:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
