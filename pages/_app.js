import { AuthProvider } from '@/context/AuthContext'
import { WorkflowProvider } from '@/context/WorkflowContext'
import { SessionGuard } from '@/components/SessionGuard'
import "@/styles/globals.css"
import Layout from '@/components/Layout'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <SessionGuard>
          {Component.noLayout ? (
            <Component {...pageProps} />
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
        </SessionGuard>
      </WorkflowProvider>
    </AuthProvider>
  )
}