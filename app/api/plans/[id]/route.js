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

    const decodedId = decodeURIComponent(id);

    // Log to check correct ID and user
    console.log(`Retrieving plan with ID: ${decodedId} for user: ${userId}`);

    const planData = await redis.hget(`user:${userId}:plans`, decodedId);

    if (!planData) {
      console.log('Plan not found');
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    // The plan is already an object, so no need to parse it again if it's already parsed
    console.log(`Plan retrieved successfully:`, planData);  // Log the actual plan data

    const plan = typeof planData === 'string' ? JSON.parse(planData) : planData;

    return new Response(JSON.stringify({ plan }), { status: 200 });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
