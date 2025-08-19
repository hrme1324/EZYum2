// ================== EZYUM EXTENSIVE DEBUG LOGGING SYSTEM ==================
// This system provides comprehensive logging for all app operations
// Easy to turn on/off with environment variables or localStorage

export interface DebugConfig {
  enabled: boolean;
  level: 'basic' | 'detailed' | 'verbose';
  includeTiming: boolean;
  includeStackTraces: boolean;
  includeUserContext: boolean;
  includeNetworkDetails: boolean;
  includeStateChanges: boolean;
  includePerformance: boolean;
  logToConsole: boolean;
  logToStorage: boolean;
  maxStorageLogs: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  operation: string;
  message: string;
  details?: any;
  timing?: {
    start: number;
    end: number;
    duration: number;
  };
  userContext?: {
    userId?: string;
    isAuthenticated: boolean;
    currentPage?: string;
    userAgent?: string;
  };
  networkDetails?: {
    url?: string;
    method?: string;
    status?: number;
    responseTime?: number;
    error?: any;
  };
  stackTrace?: string;
  performance?: {
    memoryUsage?: any;
    renderTime?: number;
    componentRenderTime?: number;
  };
}

class DebugLogger {
  private config: DebugConfig;
  private logs: LogEntry[] = [];
  private timers: Map<string, number> = new Map();
  private isInitialized = false;

  constructor() {
    this.config = this.loadConfig();
    this.initialize();
  }

  private loadConfig(): DebugConfig {
    // Check localStorage first, then environment variables
    const stored = localStorage.getItem('ezyum_debug_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored debug config, using defaults');
      }
    }

    return {
      enabled: import.meta.env.VITE_DEBUG_LOGGING === 'true' || false,
      level: (import.meta.env.VITE_DEBUG_LEVEL as any) || 'basic',
      includeTiming: import.meta.env.VITE_DEBUG_TIMING === 'true' || false,
      includeStackTraces: import.meta.env.VITE_DEBUG_STACKS === 'true' || false,
      includeUserContext: import.meta.env.VITE_DEBUG_USER_CONTEXT === 'true' || false,
      includeNetworkDetails: import.meta.env.VITE_DEBUG_NETWORK === 'true' || false,
      includeStateChanges: import.meta.env.VITE_DEBUG_STATE === 'true' || false,
      includePerformance: import.meta.env.VITE_DEBUG_PERFORMANCE === 'true' || false,
      logToConsole: import.meta.env.VITE_DEBUG_CONSOLE !== 'false',
      logToStorage: import.meta.env.VITE_DEBUG_STORAGE === 'true' || false,
      maxStorageLogs: parseInt(import.meta.env.VITE_DEBUG_MAX_LOGS || '1000'),
    };
  }

  private initialize() {
    if (this.isInitialized) return;

    if (this.config.enabled) {
      this.log('debug', 'system', 'initialization', 'Debug logging system initialized', {
        config: this.config,
        timestamp: new Date().toISOString(),
      });

      // Set up global error handlers
      this.setupGlobalErrorHandling();

      // Set up performance monitoring
      if (this.config.includePerformance) {
        this.setupPerformanceMonitoring();
      }
    }

    this.isInitialized = true;
  }

  private setupGlobalErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.log('error', 'system', 'global_error', 'Global error occurred', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'system', 'unhandled_promise', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });

    // React error boundary fallback - only if React is available
    if (typeof window !== 'undefined' && (window as any).React && (window as any).React.Component) {
      const React = (window as any).React;
      const originalComponentDidCatch = React.Component.prototype.componentDidCatch;
      React.Component.prototype.componentDidCatch = function (error: Error, errorInfo: any) {
        // Use the debugLogger instance instead of this.log
        debugLogger.log('error', 'react', 'component_error', 'React component error', {
          error: error.message,
          componentStack: errorInfo.componentStack,
          component: this.constructor.name,
        });

        if (originalComponentDidCatch) {
          originalComponentDidCatch.call(this, error, errorInfo);
        }
      };
    }
  }

  private setupPerformanceMonitoring() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.log('debug', 'performance', 'memory_usage', 'Memory usage snapshot', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }, 30000); // Every 30 seconds
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Log tasks longer than 50ms
              this.log('warn', 'performance', 'long_task', 'Long task detected', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        this.log('warn', 'performance', 'observer_setup', 'Failed to setup performance observer', {
          error: e,
        });
      }
    }
  }

  // ================== PUBLIC LOGGING METHODS ==================

  // eslint-disable-next-line max-params
  public startTimer(operation: string): string {
    if (!this.config.enabled || !this.config.includeTiming) return '';

    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timers.set(timerId, performance.now());
    return timerId;
  }

  public endTimer(timerId: string): number | null {
    if (!this.config.enabled || !this.config.includeTiming || !this.timers.has(timerId)) {
      return null;
    }

    const startTime = this.timers.get(timerId)!;
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.timers.delete(timerId);
    return duration;
  }

  // eslint-disable-next-line max-params
  public log(
    level: LogEntry['level'],
    category: string,
    operation: string,
    message: string,
    details?: any,
    timerId?: string,
  ) {
    if (!this.config.enabled) return;

    // Check if we should log based on level
    if (this.shouldSkipLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      operation,
      message,
      details,
    };

    // Add timing if available
    if (timerId && this.config.includeTiming) {
      const duration = this.endTimer(timerId);
      if (duration !== null) {
        entry.timing = {
          start: Date.now() - duration,
          end: Date.now(),
          duration,
        };
      }
    }

    // Add user context if enabled
    if (this.config.includeUserContext) {
      entry.userContext = this.getUserContext();
    }

    // Add stack trace if enabled
    if (this.config.includeStackTraces && level === 'error') {
      entry.stackTrace = new Error().stack;
    }

    // Add performance data if enabled
    if (this.config.includePerformance) {
      entry.performance = this.getPerformanceData();
    }

    // Store the log entry
    this.logs.push(entry);
    this.trimLogs();

    // Output to console if enabled
    if (this.config.logToConsole) {
      this.outputToConsole(entry);
    }

    // Store in localStorage if enabled
    if (this.config.logToStorage) {
      this.storeLogs();
    }
  }

  private shouldSkipLog(level: LogEntry['level']): boolean {
    const levelPriority = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4,
    };

    const configPriority = {
      basic: 1,
      detailed: 2,
      verbose: 3,
    };

    return levelPriority[level] < configPriority[this.config.level];
  }

  private getUserContext() {
    try {
      return {
        userId: localStorage.getItem('ezyum_user_id') || undefined,
        isAuthenticated: !!localStorage.getItem('ezyum_auth_token'),
        currentPage: window.location.pathname,
        userAgent: navigator.userAgent,
      };
    } catch (e) {
      return {
        userId: undefined,
        isAuthenticated: false,
        currentPage: undefined,
        userAgent: undefined,
        error: 'Failed to get user context',
      };
    }
  }

  private getPerformanceData() {
    try {
      return {
        memoryUsage: 'memory' in performance ? (performance as any).memory : undefined,
        renderTime: performance.now(),
        componentRenderTime: Date.now(),
      };
    } catch (e) {
      return { error: 'Failed to get performance data' };
    }
  }

  private outputToConsole(entry: LogEntry) {
    const prefix = `[EZYUM DEBUG] [${entry.category.toUpperCase()}] [${entry.operation.toUpperCase()}]`;
    const timing = entry.timing ? ` (${entry.timing.duration.toFixed(2)}ms)` : '';

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}${timing}`, entry.details || '');
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}${timing}`, entry.details || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}${timing}`, entry.details || '');
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}${timing}`, entry.details || '');
        break;
      case 'critical':
        console.error(`🚨 ${prefix} ${entry.message}${timing}`, entry.details || '');
        break;
    }
  }

  private trimLogs() {
    if (this.logs.length > this.config.maxStorageLogs) {
      this.logs = this.logs.slice(-this.config.maxStorageLogs);
    }
  }

  private storeLogs() {
    try {
      localStorage.setItem('ezyum_debug_logs', JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Failed to store debug logs:', e);
    }
  }

  // ================== CONFIGURATION METHODS ==================

  public updateConfig(newConfig: Partial<DebugConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('ezyum_debug_config', JSON.stringify(this.config));

    this.log('info', 'system', 'config_update', 'Debug configuration updated', {
      newConfig: this.config,
    });
  }

  public getConfig(): DebugConfig {
    return { ...this.config };
  }

  public enable() {
    this.updateConfig({ enabled: true });
  }

  public disable() {
    this.updateConfig({ enabled: false });
  }

  public setLevel(level: DebugConfig['level']) {
    this.updateConfig({ level });
  }

  // ================== UTILITY METHODS ==================

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    if (this.config.logToStorage) {
      localStorage.removeItem('ezyum_debug_logs');
    }
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  public getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  public getLogsByOperation(operation: string): LogEntry[] {
    return this.logs.filter((log) => log.operation === operation);
  }

  public getErrorLogs(): LogEntry[] {
    return this.logs.filter((log) => log.level === 'error' || log.level === 'critical');
  }

  public getPerformanceLogs(): LogEntry[] {
    return this.logs.filter((log) => log.timing && log.timing.duration > 100);
  }

  // ================== CONVENIENCE METHODS ==================

  // eslint-disable-next-line max-params
  public debug(
    category: string,
    operation: string,
    message: string,
    details?: any,
    timerId?: string,
  ) {
    this.log('debug', category, operation, message, details, timerId);
  }

  // eslint-disable-next-line max-params
  public info(
    category: string,
    operation: string,
    message: string,
    details?: any,
    timerId?: string,
  ) {
    this.log('info', category, operation, message, details, timerId);
  }

  // eslint-disable-next-line max-params
  public warn(
    category: string,
    operation: string,
    message: string,
    details?: any,
    timerId?: string,
  ) {
    this.log('warn', category, operation, message, details, timerId);
  }

  // eslint-disable-next-line max-params
  public error(
    category: string,
    operation: string,
    message: string,
    details?: any,
    timerId?: string,
  ) {
    this.log('error', category, operation, message, details, timerId);
  }

  // eslint-disable-next-line max-params
  public critical(
    category: string,
    operation: string,
    message: string,
    details?: any,
    timerId?: string,
  ) {
    this.log('critical', category, operation, message, details, timerId);
  }

  // ================== CATEGORY-SPECIFIC METHODS ==================

  // Recipes
  public recipeDebug(operation: string, message: string, details?: any, timerId?: string) {
    this.debug('recipes', operation, message, details, timerId);
  }

  public recipeInfo(operation: string, message: string, details?: any, timerId?: string) {
    this.info('recipes', operation, message, details, timerId);
  }

  public recipeWarn(operation: string, message: string, details?: any, timerId?: string) {
    this.warn('recipes', operation, message, details, timerId);
  }

  public recipeError(operation: string, message: string, details?: any, timerId?: string) {
    this.error('recipes', operation, message, details, timerId);
  }

  // Grocery
  public groceryDebug(operation: string, message: string, details?: any, timerId?: string) {
    this.debug('grocery', operation, message, details, timerId);
  }

  public groceryInfo(operation: string, message: string, details?: any, timerId?: string) {
    this.info('grocery', operation, message, details, timerId);
  }

  public groceryWarn(operation: string, message: string, details?: any, timerId?: string) {
    this.warn('grocery', operation, message, details, timerId);
  }

  public groceryError(operation: string, message: string, details?: any, timerId?: string) {
    this.error('grocery', operation, message, details, timerId);
  }

  // Pantry
  public pantryDebug(operation: string, message: string, details?: any, timerId?: string) {
    this.debug('pantry', operation, message, details, timerId);
  }

  public pantryInfo(operation: string, message: string, details?: any, timerId?: string) {
    this.info('pantry', operation, message, details, timerId);
  }

  public pantryWarn(operation: string, message: string, details?: any, timerId?: string) {
    this.warn('pantry', operation, message, details, timerId);
  }

  public pantryError(operation: string, message: string, details?: any, timerId?: string) {
    this.error('pantry', operation, message, details, timerId);
  }

  // Auth
  public authDebug(operation: string, message: string, details?: any, timerId?: string) {
    this.debug('auth', operation, message, details, timerId);
  }

  public authInfo(operation: string, message: string, details?: any, timerId?: string) {
    this.info('auth', operation, message, details, timerId);
  }

  public authWarn(operation: string, message: string, details?: any, timerId?: string) {
    this.warn('auth', operation, message, details, timerId);
  }

  public authError(operation: string, message: string, details?: any, timerId?: string) {
    this.error('auth', operation, message, details, timerId);
  }

  // Network
  public networkDebug(operation: string, message: string, details?: any, timerId?: string) {
    this.debug('network', operation, message, details, timerId);
  }

  public networkInfo(operation: string, message: string, details?: any, timerId?: string) {
    this.info('network', operation, message, details, timerId);
  }

  public networkWarn(operation: string, message: string, details?: any, timerId?: string) {
    this.warn('network', operation, message, details, timerId);
  }

  public networkError(operation: string, message: string, details?: any, timerId?: string) {
    this.error('network', operation, message, details, timerId);
  }

  // State
  public stateDebug(operation: string, message: string, details?: any, timerId?: string) {
    this.debug('state', operation, message, details, timerId);
  }

  public stateInfo(operation: string, message: string, details?: any, timerId?: string) {
    this.info('state', operation, message, details, timerId);
  }

  public stateWarn(operation: string, message: string, details?: any, timerId?: string) {
    this.warn('state', operation, message, details, timerId);
  }

  public stateError(operation: string, message: string, details?: any, timerId?: string) {
    this.error('state', operation, message, details, timerId);
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// Export convenience functions
export const {
  startTimer,
  endTimer,
  debug,
  info,
  warn,
  error,
  critical,
  recipeDebug,
  recipeInfo,
  recipeWarn,
  recipeError,
  groceryDebug,
  groceryInfo,
  groceryWarn,
  groceryError,
  pantryDebug,
  pantryInfo,
  pantryWarn,
  pantryError,
  authDebug,
  authInfo,
  authWarn,
  authError,
  networkDebug,
  networkInfo,
  networkWarn,
  networkError,
  stateDebug,
  stateInfo,
  stateWarn,
  stateError,
  updateConfig,
  getConfig,
  enable,
  disable,
  setLevel,
  getLogs,
  clearLogs,
  exportLogs,
  getLogsByCategory,
  getLogsByLevel,
  getLogsByOperation,
  getErrorLogs,
  getPerformanceLogs,
} = debugLogger;

// ================== REACT HOOK FOR COMPONENT LOGGING ==================

import { useEffect, useRef } from 'react';

export function useDebugLogger(category: string, componentName: string) {
  const renderTimer = useRef<string>('');
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    renderTimer.current = startTimer(`${componentName}_mount`);

    debugLogger.info(category, 'component_mount', `${componentName} mounted`, {
      componentName,
      timestamp: new Date().toISOString(),
    });

    return () => {
      const unmountTime = performance.now();
      const mountDuration = unmountTime - mountTime.current;

      debugLogger.info(category, 'component_unmount', `${componentName} unmounted`, {
        componentName,
        mountDuration: mountDuration.toFixed(2),
        timestamp: new Date().toISOString(),
      });
    };
  }, [category, componentName]);

  useEffect(() => {
    renderTimer.current = startTimer(`${componentName}_render`);

    const renderDuration = endTimer(renderTimer.current);
    if (renderDuration && renderDuration > 16) {
      // Log renders longer than 16ms (60fps threshold)
      debugLogger.warn(category, 'component_render', `${componentName} slow render detected`, {
        componentName,
        renderDuration: renderDuration.toFixed(2),
        timestamp: new Date().toISOString(),
      });
    }
  });

  return {
    debug: (operation: string, message: string, details?: any) =>
      debugLogger.debug(category, operation, message, details),
    info: (operation: string, message: string, details?: any) =>
      debugLogger.info(category, operation, message, details),
    warn: (operation: string, message: string, details?: any) =>
      debugLogger.warn(category, operation, message, details),
    error: (operation: string, message: string, details?: any) =>
      debugLogger.error(category, operation, message, details),
    startTimer: (operation: string) => startTimer(`${componentName}_${operation}`),
    endTimer: (timerId: string) => endTimer(timerId),
  };
}

// ================== ENVIRONMENT VARIABLES GUIDE ==================
/*
To enable debug logging, set these environment variables:

VITE_DEBUG_LOGGING=true                    # Enable/disable debug logging
VITE_DEBUG_LEVEL=basic|detailed|verbose   # Logging detail level
VITE_DEBUG_TIMING=true                     # Include timing information
VITE_DEBUG_STACKS=true                     # Include stack traces for errors
VITE_DEBUG_USER_CONTEXT=true               # Include user context
VITE_DEBUG_NETWORK=true                    # Include network details
VITE_DEBUG_STATE=true                      # Include state change logging
VITE_DEBUG_PERFORMANCE=true                # Include performance monitoring
VITE_DEBUG_CONSOLE=true                    # Log to console (default: true)
VITE_DEBUG_STORAGE=true                    # Store logs in localStorage
VITE_DEBUG_MAX_LOGS=1000                  # Maximum logs to store

Example .env file:
VITE_DEBUG_LOGGING=true
VITE_DEBUG_LEVEL=detailed
VITE_DEBUG_TIMING=true
VITE_DEBUG_STACKS=true
VITE_DEBUG_NETWORK=true
VITE_DEBUG_STORAGE=true
*/
