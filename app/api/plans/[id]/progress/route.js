// app/api/plans/[id]/progress/route.js

import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../../../lib/storage';

export async function POST(req, { params }) {
  try {
    const { userId } = getAuth(req);
    const { id } = params;
    const { progress } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const decodedId = decodeURIComponent(id);

    // Fetch the plan using local storage
    const plan = storage.getPlan(userId, decodedId);

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    // Update the progress
    plan.progress = progress;

    // Save the updated plan back to local storage
    const saved = storage.savePlan(userId, decodedId, plan);
    if (!saved) {
      return new Response(JSON.stringify({ error: 'Failed to update progress' }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Progress updated successfully' }), { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
