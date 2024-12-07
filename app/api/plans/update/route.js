// app/api/plans/update/route.js
import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../../lib/storage';

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { planId, progress } = await req.json();

    // Fetch the plan using local storage
    const plan = storage.getPlan(userId, planId);
    if (!plan) {
      return new Response('Plan not found', { status: 404 });
    }

    // Update the progress
    plan.progress = progress;

    // Save the updated plan back to local storage
    const saved = storage.savePlan(userId, planId, plan);
    if (!saved) {
      return new Response(JSON.stringify({ error: 'Failed to update progress' }), { status: 500 });
    }

    return new Response('Progress updated', { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
