// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

function isProtectedRoute(pathname) {
  return ['/dashboard', '/exam', '/plan'].some(prefix => 
    pathname.startsWith(prefix)
  );
}

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Middleware session check:', {
      hasSession: !!session,
      user: session?.user?.id,
      path: req.nextUrl.pathname
    });

    if (error) {
      console.error('Auth session error:', error.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    // Handle API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // If no session, block API access
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Add user ID to request headers for API routes
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', session.user.id);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Protected routes handling
    if (!session && isProtectedRoute(req.nextUrl.pathname)) {
      const redirectUrl = new URL('/auth', req.url);
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Important: Return the response with potentially modified headers
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth', req.url));
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/exam/:path*',
    '/plan/:path*'
  ]
}
