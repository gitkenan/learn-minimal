import { expandSnippet } from '../../../lib/ai-client';

export async function POST(req) {
  try {
    const { snippet } = await req.json();
    if (!snippet || typeof snippet !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid snippet provided' }), { status: 400 });
    }

    const expanded = await expandSnippet(snippet);
    return new Response(JSON.stringify({ expanded }), { status: 200 });
  } catch (error) {
    console.error('Error expanding snippet:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
