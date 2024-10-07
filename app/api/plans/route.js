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

    // Initialize an array to hold parsed plans
    const plans = [];

    // Iterate over each plan in the retrieved data
    for (const [planId, planValue] of Object.entries(plansData)) {
      try {
        let parsedPlan;

        // Check if the plan value is a string
        if (typeof planValue === 'string') {
          parsedPlan = JSON.parse(planValue);
        }
        // If it's an object, use it directly
        else if (typeof planValue === 'object' && planValue !== null) {
          parsedPlan = planValue;
        }
        // Handle unexpected types
        else {
          throw new Error(`Plan ${planId} is neither a string nor an object.`);
        }

        // Optional: Log the parsed plan for debugging
        console.log(`Parsed Plan (${planId}):`, parsedPlan);

        // Add the parsed plan to the plans array
        plans.push(parsedPlan);
      } catch (error) {
        console.error(`Error parsing plan (${planId}):`, error);
        // Optionally, you can choose to skip this plan or handle it differently
      }
    }

    // Send the parsed plans back as a JSON response
    return new Response(JSON.stringify({ plans }), { status: 200 });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
