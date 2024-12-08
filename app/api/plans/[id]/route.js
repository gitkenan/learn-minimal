// app/api/plans/[id]/route.js
import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../lib/storage';

export async function GET(request, { params }) {
  console.log('Fetching plan, params:', params);
  const { userId } = getAuth(request);
  console.log('User ID:', userId);
  
  const rawPlan = await storage.getPlan(userId, params.id);
  console.log('Raw plan from storage:', rawPlan);
  
  try {
    const { userId } = getAuth(request);
    const { id } = params;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawPlan = await storage.getPlan(userId, id);
    if (!rawPlan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Single parse operation
    let plan;
    try {
      plan = JSON.parse(rawPlan);
    } catch (e) {
      console.error('Failed to parse plan:', e);
      return Response.json({ error: 'Invalid plan data' }, { status: 500 });
    }

    return Response.json({ plan });
  } catch (error) {
    console.error('Plan retrieval error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// And when creating a plan (in /api/learn/route.js), use a simple structure:
const plan = {
  id: planId,
  topic: topic.trim(),
  content: learningSteps,
  createdAt: new Date().toISOString()
};