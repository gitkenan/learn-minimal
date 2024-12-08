// app/api/plan/[id]/route.js
import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

export async function GET(request, { params }) {
  console.log('1. Starting GET request for plan');
  console.log('2. Params received:', params);

  const { userId } = getAuth(request);
  console.log('3. User ID:', userId);

  if (!userId) {
    console.log('4a. No user ID found - returning unauthorized');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('4b. Attempting to get plan with ID:', params.id);
    const plan = await storage.getPlan(params.id);
    console.log('5. Plan from storage:', plan);
    
    if (!plan) {
      console.log('6a. No plan found - returning 404');
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Security check
    if (plan.userId !== userId) {
      console.log('6b. Plan belongs to different user - unauthorized');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('7. Successfully returning plan');
    return Response.json({ plan });
  } catch (error) {
    console.error('8. Error retrieving plan:', error);
    return Response.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}