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
