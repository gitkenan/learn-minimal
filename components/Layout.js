import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  )
}
