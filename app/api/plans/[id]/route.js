// app/api/plans/[id]/route.js

import { redis } from '../../../../lib/redis';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);
    const { id } = params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const planData = await redis.hget(`user:${userId}:plans`, id);

    if (!planData) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    const plan = JSON.parse(planData);

    return new Response(JSON.stringify({ plan }), { status: 200 });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { userId } = getAuth(req);
  const { id } = params;

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    // Delete the plan from Redis
    await redis.hdel(`user:${userId}:plans`, id);
    return new Response(JSON.stringify({ message: 'Plan deleted' }), { status: 200 });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

