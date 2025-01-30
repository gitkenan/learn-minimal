import { supabase } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  console.log('API Test - Full request details:', {
    headers: req.headers,
    cookies: req.cookies,
    method: req.method
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try multiple auth methods
    const authHeader = req.headers.authorization;
    const supabaseAuth = req.headers['x-supabase-auth'];
    
    console.log('API Test - Auth headers:', {
      authorization: authHeader,
      supabaseAuth: supabaseAuth
    });

    // First try getting session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      return res.status(200).json({
        status: 'authenticated via session',
        userId: session.user.id,
        method: 'session'
      });
    }

    // Then try token from header
    if (authHeader || supabaseAuth) {
      const token = (authHeader?.replace('Bearer ', '') || supabaseAuth);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        return res.status(200).json({
          status: 'authenticated via token',
          userId: user.id,
          method: 'token'
        });
      }
    }

    // For debugging: Return 200 with auth debug info
    return res.status(200).json({
      status: 'debug_info',
      headers: {
        authorization: !!authHeader,
        supabaseAuth: !!supabaseAuth
      },
      cookies: !!req.cookies
    });
  } catch (error) {
    console.error('API - Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
