import { AuthProvider } from '@/context/AuthContext'
import { SessionGuard } from '@/components/SessionGuard'
import "@/styles/globals.css"

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SessionGuard>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            <Component {...pageProps} />
          </main>
        </div>
      </SessionGuard>
    </AuthProvider>
  )
}