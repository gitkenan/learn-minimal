// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

function isProtectedRoute(pathname) {
  return ['/dashboard', '/exam', '/plan'].some(prefix => 
    pathname.startsWith(prefix)
  );
}

export async function middleware(req) {
  // Create response first so we can modify headers
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth session error:', error.message);
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    // Handle API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      if (!session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Create new response with auth headers
      const response = NextResponse.next({
        request: {
          headers: new Headers({
            ...Object.fromEntries(req.headers),
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      // IMPORTANT: Copy ALL headers from the middleware response
      res.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          response.headers.append(key, value);
        }
      });

      return response;
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
