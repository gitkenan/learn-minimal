// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { generateLearningPlan } from '../../../lib/ai-client';
import { v4 as uuidv4 } from 'uuid';

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

    // Return the plan - storage will happen on client side
    return new Response(
      JSON.stringify({ 
        plan,
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