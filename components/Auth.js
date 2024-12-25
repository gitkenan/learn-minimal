import { useState } from 'react'
import { initializeSupabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Auth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSignIn = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const supabase = initializeSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Get and log the session right after sign in
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Redirect to home page after successful sign in
        router.push('/')
      } else {
        throw new Error('Failed to establish session')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      const supabase = initializeSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error
      // User will receive confirmation email
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="search-input"
      />
      <input
        type="password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="search-input"
      />
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        onClick={handleSignUp}
        disabled={loading}
        className="search-button"
      >
        {loading ? 'Loading...' : 'Sign Up'}
      </button>
      
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="search-button bg-gray-700 hover:bg-gray-800"
      >
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </div>
  )
}
