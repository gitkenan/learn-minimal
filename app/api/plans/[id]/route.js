// app/api/plans/[id]/route.js
import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

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

    const plan = storage.getPlan(userId, decodedId);
    
    if (!plan) {
      console.log('Plan not found:', { userId, decodedId });
      return new Response(JSON.stringify({ 
        error: 'Plan not found',
        details: 'The requested plan could not be found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate plan structure
    if (!plan.id || !plan.content) {
      console.error('Invalid plan structure:', plan);
      return new Response(JSON.stringify({ 
        error: 'Invalid plan data',
        details: 'The plan data is corrupted or invalid'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
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
