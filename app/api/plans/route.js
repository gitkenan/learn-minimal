import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../lib/storage';

export async function GET(request) {
  const { userId } = getAuth(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const plans = await storage.getPlans(userId);
    return Response.json({ plans });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}