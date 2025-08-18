// Enhanced logger utility with intensive error logging that can be easily turned on/off
const isDevelopment = import.meta.env.DEV;
const INTENSIVE_LOGGING = import.meta.env.VITE_INTENSIVE_LOGGING === 'true' || isDevelopment;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (INTENSIVE_LOGGING) {
      // eslint-disable-next-line no-console
      console.log('📝 LOG:', message, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    // CRITICAL: Errors are ALWAYS visible, even in production
    // eslint-disable-next-line no-console
    console.error('🚨 ERROR:', message, ...args);

    // Intensive logging: always show stack trace
    if (INTENSIVE_LOGGING) {
      console.trace('Error stack trace:');
    }
  },

  warn: (message: string, ...args: any[]) => {
    // Warnings are always visible
    // eslint-disable-next-line no-console
    console.warn('⚠️ WARNING:', message, ...args);
  },

  info: (message: string, ...args: any[]) => {
    if (INTENSIVE_LOGGING) {
      // eslint-disable-next-line no-console
      console.info('ℹ️ INFO:', message, ...args);
    }
  },

  // Critical errors that should never be hidden
  critical: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error('💥 CRITICAL ERROR:', message, ...args);
    console.trace('Critical error stack trace:');

    // In production, you might want to send this to error reporting
    if (!isDevelopment) {
      // Example: Sentry.captureException(new Error(message));
    }
  },

  // Intensive logging methods
  debug: (message: string, ...args: any[]) => {
    if (INTENSIVE_LOGGING) {
      // eslint-disable-next-line no-console
      console.debug('🔍 DEBUG:', message, ...args);
      console.trace('Debug stack trace:');
    }
  },

  // Performance logging
  perf: (label: string, fn: () => any) => {
    if (INTENSIVE_LOGGING) {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`⏱️ PERF [${label}]: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  },

  // API call logging
  api: (method: string, url: string, data?: any, response?: any) => {
    if (INTENSIVE_LOGGING) {
      console.group(`🌐 API ${method} ${url}`);
      if (data) console.log('Request:', data);
      if (response) console.log('Response:', response);
      console.groupEnd();
    }
  },
};

// Global error handlers to catch any unhandled errors
export const setupGlobalErrorHandling = () => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.critical('Unhandled Promise Rejection:', event.reason);
    event.preventDefault(); // Prevent default browser behavior
  });

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logger.critical('Unhandled Error:', event.error);
  });

  // Catch React errors (if using Error Boundary)
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      logger.critical('Console Error:', ...args);
      originalConsoleError.apply(console, args);
    };
  }

  logger.log('Global error handling setup complete');
};
