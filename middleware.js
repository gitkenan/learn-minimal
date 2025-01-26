import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if needed
  const { data: { session }, error } = await supabase.auth.getSession()

  if (req.nextUrl.pathname.startsWith('/api/')) {
    if (!session) {
      console.error('No session found in middleware')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Add session token to request headers
    const headers = new Headers(req.headers)
    headers.set('x-supabase-auth', session.access_token)
    
    // Create new response with modified headers
    const newRes = NextResponse.next({
      request: {
        headers
      }
    })

    // Copy over any Set-Cookie headers
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        newRes.headers.append(key, value)
      }
    })

    return newRes
  }

  return res
}

export const config = {
  matcher: ['/api/:path*']
}
