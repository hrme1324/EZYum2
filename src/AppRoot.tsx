import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import { logger } from './utils/logger';

function AppErrorFallback({ error }: { error: Error }) {
  // use raw console here if you keep it, or logger.error (now safe)
  logger.error('App crashed:', error);
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-rich-charcoal mb-2">Something went wrong</h1>
          <p className="text-sm text-soft-taupe mb-4">
            The app encountered an error. Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-coral-blush text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppRoot() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <App />
    </ErrorBoundary>
  );
}
