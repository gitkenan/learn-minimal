import { expandSnippet } from '../../../lib/ai-client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await req.json().catch(err => {
      console.error('Failed to parse request body:', err);
      return null;
    });

    if (!body || !body.snippet || typeof body.snippet !== 'string') {
      console.error('Invalid request body:', body);
      return new Response(JSON.stringify({ error: 'Invalid request: snippet is required and must be a string' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Expanding snippet for user:', userId);
    const expanded = await expandSnippet(body.snippet);
    
    if (!expanded) {
      console.error('No expanded content returned from AI');
      return new Response(JSON.stringify({ error: 'Failed to generate expanded content' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Successfully expanded snippet');
    // Ensure we're wrapping the expanded content in a proper JSON object
    const responseData = { expanded: expanded };
    return new Response(JSON.stringify(responseData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in expand route:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
