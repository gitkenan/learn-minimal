import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  console.log('API - Request headers:', {
    auth: req.headers.authorization,
    cookie: !!req.headers.cookie
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    
    // Log the token we're receiving
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('API - Token check:', {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });

    // Try both methods - session and token
    const { data: { session } } = await supabase.auth.getSession();
    console.log('API - Session check:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id
    });

    if (!session) {
      // If no session, try token
      if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        console.log('API - Token auth result:', {
          hasUser: !!user,
          userId: user?.id,
          error: error?.message
        });
        
        if (user && !error) {
          return res.status(200).json({ 
            status: 'authenticated via token',
            userId: user.id
          });
        }
      }
      return res.status(401).json({ error: 'No valid session or token' });
    }

    return res.status(200).json({ 
      status: 'authenticated via session',
      userId: session.user.id
    });
  } catch (error) {
    console.error('API - Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
