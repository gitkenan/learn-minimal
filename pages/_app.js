import { AuthProvider } from '@/context/AuthContext'
import { SessionGuard } from '@/components/SessionGuard'
import "@/styles/globals.css"

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SessionGuard>
        <Component {...pageProps} />
      </SessionGuard>
    </AuthProvider>
  )
}
