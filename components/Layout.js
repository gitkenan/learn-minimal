import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full relative z-0">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 
                      py-4 md:py-6 lg:py-8 
                      transition-all duration-200 ease-in-out">
          <div className="content-spacing">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
