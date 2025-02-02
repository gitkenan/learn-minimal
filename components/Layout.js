// components/Layout.js
import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  )
}
