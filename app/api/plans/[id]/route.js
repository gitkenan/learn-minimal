import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { id } = params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const plan = await storage.getPlan(userId, decodeURIComponent(id));
    
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ plan }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error retrieving plan:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}