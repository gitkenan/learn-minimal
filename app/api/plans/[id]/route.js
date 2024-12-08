// app/api/plans/[id]/route.js
import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);
    const { id } = params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Attempting to get plan:', id, 'for user:', userId);

    const plan = await storage.getPlan(userId, decodeURIComponent(id));
    
    if (!plan) {
      console.log('Plan not found:', id);
      return new Response(JSON.stringify({ error: 'Plan not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Successfully retrieved plan:', id);
    return new Response(JSON.stringify({ plan }), { 
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
