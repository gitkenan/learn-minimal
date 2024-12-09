import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../lib/storage';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const plans = await storage.getPlans(userId);
    return new Response(JSON.stringify({ plans }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error retrieving plans:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}