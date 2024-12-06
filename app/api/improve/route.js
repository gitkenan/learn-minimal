import { improveSnippet } from '../../../lib/ai-client';

export async function POST(req) {
  try {
    const { snippet, feedback } = await req.json();
    if (!snippet || typeof snippet !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid snippet provided' }), { status: 400 });
    }
    if (!feedback || typeof feedback !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid feedback provided' }), { status: 400 });
    }

    const improved = await improveSnippet(snippet, feedback);
    return new Response(JSON.stringify({ improved }), { status: 200 });
  } catch (error) {
    console.error('Error improving snippet:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
