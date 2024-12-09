import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

export async function GET(request, { params }) {
  const { userId } = getAuth(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const plan = await storage.getPlan(params.id);
    
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Security check - ensure user can only access their own plans
    if (plan.userId !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return Response.json({ plan });
  } catch (error) {
    console.error('Plan retrieval error:', error);
    return Response.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}