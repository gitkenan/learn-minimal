import Link from 'next/link'

export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-h1 text-primary">404</h1>
        <h2 className="text-h3 text-secondary">Page Not Found</h2>
        <p className="text-secondary/80 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-accent hover:bg-accent-hover 
                     text-white rounded-xl transition duration-200 ease-in-out
                     focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
