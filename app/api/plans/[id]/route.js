// app/api/plans/[id]/route.js
import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);
    const { id } = params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const plan = await storage.getPlan(userId, decodeURIComponent(id));
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ plan }), { status: 200 });
  } catch (error) {
    console.error('Error retrieving plan:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
