import { auth } from '@clerk/nextjs';
import { generateLearningPlan } from '../../../lib/ai-client';
import { storage } from '../../../lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const { userId } = auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { topic } = await request.json();
  if (!topic) return Response.json({ error: 'Topic required' }, { status: 400 });

  try {
    const content = await generateLearningPlan(topic);
    const plan = {
      id: uuidv4(),
      topic: topic.trim(),
      content,
      createdAt: new Date().toISOString()
    };

    await storage.savePlan(userId, plan.id, plan);
    return Response.json({ plan }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}