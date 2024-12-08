// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { generateLearningPlan } from '../../../lib/ai-client';
import { storage } from '../../../lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { topic } = await request.json();
    if (!topic?.trim()) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate the plan content
    const planContent = await generateLearningPlan(topic);
    if (!planContent) {
      return new Response(JSON.stringify({ 
        error: 'Failed to generate plan - no content returned',
        provider: process.env.AI_PROVIDER
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create and store the plan
    const planId = uuidv4();
    const plan = {
      id: planId,
      topic: topic.trim(),
      content: planContent,
      createdAt: new Date().toISOString(),
      progress: {}
    };

    const saved = await storage.savePlan(userId, planId, plan);
    if (!saved) {
      return new Response(JSON.stringify({ 
        error: 'Failed to save plan to storage',
        provider: process.env.AI_PROVIDER
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      plan, 
      message: 'Plan created successfully',
      provider: process.env.AI_PROVIDER 
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in learn route:', {
      message: error.message,
      stack: error.stack,
      provider: process.env.AI_PROVIDER
    });

    // Return a more detailed error message
    return new Response(JSON.stringify({ 
      error: `Error generating plan: ${error.message}`,
      provider: process.env.AI_PROVIDER
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
