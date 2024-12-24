import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  // Only run on API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return res
  }

  // Allow all other routes to pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
