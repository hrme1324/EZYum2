// logger.ts
// Keep the original console methods so we can call them safely.
const rawConsole = {
  log:   window.console.log.bind(window.console),
  info:  window.console.info.bind(window.console),
  warn:  window.console.warn.bind(window.console),
  error: window.console.error.bind(window.console),
};

let inCritical = false;

export const logger = {
  debug: (...args: any[]) => rawConsole.log('[DEBUG]', ...args),
  info:  (...args: any[]) => rawConsole.info('[INFO]', ...args),
  warn:  (...args: any[]) => rawConsole.warn('[WARN]', ...args),
  error: (...args: any[]) => rawConsole.error('[ERROR]', ...args),

  critical: (...args: any[]) => {
    // Guard against re-entrancy if console.error is patched elsewhere.
    if (inCritical) { rawConsole.error('[CRITICAL]', ...args); return; }
    try {
      inCritical = true;
      rawConsole.error('[CRITICAL]', ...args);
      // TODO: forward to Sentry/Logflare here if you use one
    } finally {
      inCritical = false;
    }
  },

  // Keep the old methods for compatibility
  log: (...args: any[]) => rawConsole.log('[LOG]', ...args),

  // Performance logging
  perf: (label: string, fn: () => any) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    rawConsole.log(`⏱️ PERF [${label}]: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // API call logging
  api: (method: string, url: string, data?: any, response?: any) => {
    rawConsole.log(`🌐 API ${method} ${url}`);
    if (data) rawConsole.log('Request:', data);
    if (response) rawConsole.log('Response:', response);
  },
};

// IMPORTANT: Do NOT monkey-patch console.* here.
// If somewhere else you have lines like:
//   console.error = (...a) => logger.critical(...a)
// remove them. If you *must* patch, do this instead:

export function installSafeConsolePatch() {
  const originalError = rawConsole.error;
  // Example: forward to original, then to our logger without recursion
  // (but best is: don't patch at all)
  (window.console as any).error = (...a: any[]) => {
    originalError(...a);
    // do not call logger.critical here — it would loop in some stacks
  };
}

// Setup global error handling without recursion
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    rawConsole.error('💥 Unhandled Promise Rejection:', event.reason);
    // Prevent the default browser behavior
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    rawConsole.error('💥 Uncaught Error:', event.error);
  });
};
