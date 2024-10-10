// app/api/plans/update/route.js
import { getAuth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { planId, progress } = await req.json();

    const planData = await redis.hget(`user:${userId}:plans`, planId);
    if (!planData) {
      return new Response('Plan not found', { status: 404 });
    }

    const plan = JSON.parse(planData);
    plan.progress = progress;

    await redis.hset(`user:${userId}:plans`, {
      [planId]: JSON.stringify(plan),
    });

    return new Response('Progress updated', { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
