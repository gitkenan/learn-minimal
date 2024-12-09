// app/api/plans/route.js

import { getAuth } from '@clerk/nextjs/server';
import { storage } from '../../../lib/storage';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = params;
    const decodedId = decodeURIComponent(id);
    console.log(`Retrieving plan with ID: ${decodedId} for user: ${userId}`);

    // Fetch the plan using local storage
    const plan = storage.getPlan(userId, decodedId);
    
    if (!plan) {
      console.log('Plan not found:', { userId, decodedId });
      return new Response(JSON.stringify({ 
        error: 'Plan not found',
        details: 'The requested plan could not be found'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate plan structure
    if (!plan.id || !plan.content) {
      console.error('Invalid plan structure:', plan);
      return new Response(JSON.stringify({ 
        error: 'Invalid plan data',
        details: 'The plan data is corrupted or invalid'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize progress if it doesn't exist
    if (!plan.progress) {
      plan.progress = {};
    }

    console.log('Plan retrieved successfully:', { planId: plan.id, topic: plan.topic });
    
    return new Response(JSON.stringify({ 
      plan,
      message: 'Plan retrieved successfully'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { planId, topic } = await req.json();

    if (!planId || !topic) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const newPlan = {
      id: planId,
      topic,
      createdAt: new Date().toISOString(),
    };

    const saved = storage.savePlan(userId, planId, newPlan);
    if (!saved) {
      return new Response(JSON.stringify({ error: 'Failed to save plan' }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Plan created successfully' }), { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
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
