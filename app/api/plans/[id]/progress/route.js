// app/api/plans/[id]/progress/route.js

import { redis } from '../../../../../lib/redis';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req, { params }) {
  try {
    const { userId } = getAuth(req);
    const { id } = params;
    const { progress } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const planData = await redis.hget(`user:${userId}:plans`, id);

    if (!planData) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    const plan = JSON.parse(planData);
    plan.progress = progress;

    await redis.hset(`user:${userId}:plans`, { [id]: JSON.stringify(plan) });

    return new Response(JSON.stringify({ message: 'Progress updated' }), { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

