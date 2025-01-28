import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if needed
  const { data: { session }, error } = await supabase.auth.getSession()

  // Handle API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Add session token to request headers
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('Authorization', `Bearer ${session.access_token}`)
    
    const response = NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })

    // Copy cookies from Supabase auth response
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        response.headers.append(key, value)
      }
    })

    return response
  }

  // Handle protected routes
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/exam') ||
    req.nextUrl.pathname.startsWith('/plan')
  )) {
    const redirectUrl = new URL('/auth', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/exam/:path*',
    '/plan/:path*'
  ]
}
