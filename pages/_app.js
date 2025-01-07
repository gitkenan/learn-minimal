import { AuthProvider } from '@/context/AuthContext'
import { SessionGuard } from '@/components/SessionGuard'
import MobileNav from '@/components/MobileNav' // Add this import
import "@/styles/globals.css"

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SessionGuard>
        <div className="min-h-screen flex flex-col">
          <MobileNav />
          <main className="flex-1">
            <Component {...pageProps} />
          </main>
        </div>
      </SessionGuard>
    </AuthProvider>
  )
}