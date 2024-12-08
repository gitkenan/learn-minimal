import { getAuth } from '@clerk/nextjs/server';
import { generateLearningPlan } from '../../../lib/ai-client';
import { storage } from '../../../lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const { userId } = getAuth(request);
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { topic } = await request.json();
  if (!topic) return Response.json({ error: 'Topic required' }, { status: 400 });

  try {
    const content = await generateLearningPlan(topic);
    const plan = {
      id: uuidv4(),
      userId, // Store userId with the plan
      topic: topic.trim(),
      content,
      createdAt: new Date().toISOString()
    };

    await storage.savePlan(plan);
    return Response.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Plan creation error:', error);
    return Response.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}