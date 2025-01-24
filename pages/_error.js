function Error({ statusCode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-h1 text-primary">{statusCode || 'Error'}</h1>
        <h2 className="text-h3 text-secondary">
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : 'An error occurred on client'}
        </h2>
        <p className="text-secondary/80 max-w-md mx-auto">
          We're sorry, but something went wrong. Please try again later.
        </p>
        <div className="mt-8">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 bg-accent hover:bg-accent-hover 
                     text-white rounded-xl transition duration-200 ease-in-out
                     focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
