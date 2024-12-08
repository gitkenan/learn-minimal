// app/api/learn/route.js
import { getAuth } from '@clerk/nextjs/server';
import { generateLearningPlan } from '../../../lib/ai-client';
import { storage } from '../../../lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    console.log('Starting learn route...');
    
    const { userId } = getAuth(request);
    
    if (!userId) {
      console.log('No user ID found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { topic } = await request.json();
    if (!topic) {
      console.log('No topic provided');
      return new Response(JSON.stringify({ error: 'Topic is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating plan for topic:', topic);
    const planContent = await generateLearningPlan(topic);
    if (!planContent) {
      console.error('No plan content generated');
      return new Response(JSON.stringify({ 
        error: 'Failed to generate plan - no content returned',
        provider: process.env.AI_PROVIDER
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('Plan content generated successfully');

    // Create and store the plan
    const planId = uuidv4();
    const plan = {
      id: planId,
      topic: topic.trim(),
      content: planContent,
      createdAt: new Date().toISOString(),
      progress: {}
    };

    console.log('Validating plan structure...');
    const requiredFields = ['id', 'topic', 'content', 'createdAt', 'progress'];
    const missingFields = requiredFields.filter(field => !Object.keys(plan).includes(field));
    if (missingFields.length > 0) {
      console.error('Invalid plan structure:', {
        missingFields,
        planFields: Object.keys(plan)
      });
      return new Response(JSON.stringify({ 
        error: 'Invalid plan structure',
        details: `Missing fields: ${missingFields.join(', ')}`
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('Plan structure is valid');

    console.log('Attempting to save plan:', {
      userId,
      planId,
      topicLength: topic.length,
      contentLength: planContent.length,
      planFields: Object.keys(plan)
    });

    try {
      const saved = await storage.savePlan(userId, planId, plan);
      if (!saved) {
        throw new Error('Save operation returned false');
      }
      console.log('Plan saved successfully:', planId);
      return new Response(JSON.stringify({ 
        plan, 
        message: 'Plan created successfully',
        provider: process.env.AI_PROVIDER 
      }), { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (storageError) {
      console.error('Storage error details:', {
        message: storageError.message,
        stack: storageError.stack
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to save plan to storage', 
        details: storageError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in learn route:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name,
      provider: process.env.AI_PROVIDER
    });
    return new Response(JSON.stringify({ 
      error: `Error generating plan: ${error.message}`,
      type: error.constructor.name,
      provider: process.env.AI_PROVIDER
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
