// app/api/plans/route.js

import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../lib/storage';

// GET /api/plans - List all plans for the authenticated user
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const plans = await storage.getPlans(userId); // Fetch all plans for the user
    return new Response(JSON.stringify({ plans }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error retrieving plans:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/plans - Create a new plan for the authenticated user
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { planId, topic } = await req.json();
    if (!planId || !topic) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newPlan = {
      id: planId,
      topic,
      createdAt: new Date().toISOString(),
      content: '', // Initialize with empty content or default value
      progress: {},
    };

    const saved = await storage.savePlan(userId, planId, newPlan);
    if (!saved) {
      return new Response(JSON.stringify({ error: 'Failed to save plan' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Plan created successfully', plan: newPlan }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { planId, updatedPlan } = await req.json();

    if (!planId || !updatedPlan) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Update the plan using local storage
    const existingPlan = storage.getPlan(userId, planId);
    if (!existingPlan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
    }

    // Merge the updated plan data with the existing plan
    const updatedData = { ...existingPlan, ...updatedPlan };

    // Save the updated plan back to local storage
    const saved = storage.savePlan(userId, planId, updatedData);
    if (!saved) {
      return new Response(JSON.stringify({ error: 'Failed to update plan' }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Plan updated successfully' }), { status: 200 });
  } catch (error) {
    console.error("Error updating plan:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Delete the plan using local storage
    const deleted = storage.deletePlan(userId, planId);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Failed to delete plan' }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Plan deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
