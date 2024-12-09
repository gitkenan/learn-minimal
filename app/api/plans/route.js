import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../lib/storage';

export async function GET() {
  const { userId } = getAuth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const plans = await storage.getPlans(userId);
    return Response.json({ plans });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

// app/api/plans/[id]/route.js
import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

export async function GET(request, { params }) {
  const { userId } = getAuth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rawPlan = await storage.getPlan(userId, params.id);
    if (!rawPlan) return Response.json({ error: 'Plan not found' }, { status: 404 });
    
    const plan = JSON.parse(rawPlan);
    return Response.json({ plan });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}
