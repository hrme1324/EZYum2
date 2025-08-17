// src/utils/debug.ts

// Safe way to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Safe way to get debug state without accessing browser APIs during module init
const getDebugState = () => {
  if (!isBrowser) return false;

  try {
    return (
      import.meta.env.DEV ||
      new URLSearchParams(window.location.search).has('debug') ||
      localStorage.getItem('DEBUG') === '1'
    );
  } catch (error) {
    console.warn('Could not determine debug state:', error);
    return import.meta.env.DEV;
  }
};

const DEBUG = getDebugState();

export const Debug = {
  enabled: DEBUG,
  log: (...args: any[]) => DEBUG && console.log('[dbg]', ...args),
  info: (...args: any[]) => DEBUG && console.info('[dbg]', ...args),
  warn: (...args: any[]) => DEBUG && console.warn('[dbg]', ...args),
  error: (...args: any[]) => DEBUG && console.error('[dbg]', ...args),
};

/** Global error & unhandled promise logs */
export function installGlobalErrorLogs() {
  if (!isBrowser || !DEBUG || (window as any).__globalErrorsInstalled) return;
  (window as any).__globalErrorsInstalled = true;

  try {
    window.addEventListener('error', (e) => {
      console.error('[window.error]', e.message, e.error);
    });
    window.addEventListener('unhandledrejection', (e) => {
      console.error('[unhandledrejection]', e.reason);
    });
  } catch (error) {
    console.warn('Could not install global error logs:', error);
  }
}

/** Patch window.fetch to log URL, status & duration (dev/debug only) */
export function installFetchLogger() {
  if (!isBrowser || !DEBUG || (window as any).__fetchPatched) return;
  (window as any).__fetchPatched = true;

  try {
    const orig = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const id = Math.random().toString(36).slice(2, 8);
      const url = typeof input === 'string' ? input : (input as Request).url;
      const t0 = performance.now();
      try {
        const res = await orig(input, init);
        const ms = Math.round(performance.now() - t0);
        console.debug(`[fetch ${id}] ${res.status} ${url} (${ms}ms)`);
        return res;
      } catch (err) {
        const ms = Math.round(performance.now() - t0);
        console.error(`[fetch ${id}] ERROR ${url} (${ms}ms)`, err);
        throw err;
      }
    };
  } catch (error) {
    console.warn('Could not install fetch logger:', error);
  }
}

/** Log Supabase responses (wrap any Supabase promise) */
export async function logSupabase<T>(
  label: string,
  promise: Promise<any>
): Promise<T> {
  const t0 = performance.now();
  const res = await promise;
  const ms = Math.round(performance.now() - t0);

  if (res?.error) {
    console.error(`[supabase:${label}] ERROR (${ms}ms)`, res.error);
  } else {
    const rows = Array.isArray(res?.data) ? res.data.length : res?.data ? 1 : 0;
    console.debug(`[supabase:${label}] OK rows=${rows} (${ms}ms)`);
  }
  return res;
}

/** Warn if a loading flag stays true too long */
export function useLoadingWatchdog(loading: boolean, label: string, timeoutMs = 10000) {
  // React-safe dynamic import to avoid hard React import here
  // Usage: call inside a component; it uses useEffect under the hood
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  // @ts-ignore
  return import('react').then(({ useEffect }) => {
    useEffect(() => {
      if (!loading) return;
      const id = setTimeout(() => {
        console.warn(`[watchdog] "${label}" still loading after ${timeoutMs}ms`);
      }, timeoutMs);
      return () => clearTimeout(id);
    }, [loading, label, timeoutMs]);
  });
}
