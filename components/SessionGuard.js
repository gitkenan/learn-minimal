import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

// Add more public routes as needed
const PUBLIC_ROUTES = ['/auth', '/login', '/signup', '/dashboard']

export function SessionGuard({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname)

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push('/auth')
    }
  }, [user, loading, isPublicRoute, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!user && !isPublicRoute) {
    return null
  }

  // Render children if authenticated or on public route
  return children
}
