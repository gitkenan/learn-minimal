// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { generateLearningPlan } from '../../../lib/ai-client';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../../lib/storage';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401 }
      );
    }

    const { topic } = await request.json();
    if (!topic?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }), 
        { status: 400 }
      );
    }

    // Generate the plan content
    const planContent = await generateLearningPlan(topic);
    if (!planContent) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate plan',
          details: 'No plan content was generated' 
        }), 
        { status: 500 }
      );
    }

    // Create the plan object
    const planId = uuidv4();
    const plan = {
      id: planId,
      topic: topic.trim(),
      content: planContent,
      createdAt: new Date().toISOString(),
      progress: {}
    };

    // Attempt to save the plan
    if (!storage.checkStorage()) {
      return new Response(
        JSON.stringify({ 
          error: 'Storage unavailable',
          details: 'Browser storage is not available or full' 
        }), 
        { status: 500 }
      );
    }

    const saved = storage.savePlan(userId, planId, plan);
    if (!saved) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save plan',
          details: 'Could not save to browser storage' 
        }), 
        { status: 500 }
      );
    }

    // Verify the plan was saved
    const savedPlan = storage.getPlan(userId, planId);
    if (!savedPlan) {
      return new Response(
        JSON.stringify({ 
          error: 'Plan verification failed',
          details: 'Plan was not found after saving' 
        }), 
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        plan: savedPlan,
        message: 'Plan created successfully' 
      }), 
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in learn route:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}