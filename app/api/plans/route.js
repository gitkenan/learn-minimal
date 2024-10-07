// app/api/plans/route.js

import { redis } from '../../../lib/redis';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Fetch all plans for the user
    const plansData = await redis.hgetall(`user:${userId}:plans`) || {};
    const plans = Object.values(plansData).map(plan => JSON.parse(plan));

    return new Response(JSON.stringify({ plans }), { status: 200 });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

