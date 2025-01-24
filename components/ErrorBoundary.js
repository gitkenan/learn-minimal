import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-h1 text-primary">Oops!</h1>
            <h2 className="text-h3 text-secondary">Something went wrong</h2>
            <p className="text-secondary/80 max-w-md mx-auto">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="mt-8">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 bg-accent hover:bg-accent-hover 
                         text-white rounded-xl transition duration-200 ease-in-out
                         focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
