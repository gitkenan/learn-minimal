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
    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const content = await generateLearningPlan(topic);
    const planId = uuidv4();
    
    const plan = {
      id: planId,
      topic: topic.trim(),
      content,
      createdAt: new Date().toISOString()
    };

    await storage.savePlan(userId, planId, plan);

    return new Response(JSON.stringify({ plan }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in learn route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate plan' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}