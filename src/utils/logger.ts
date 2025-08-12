// Logger utility for consistent logging across the application
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(message, ...args);
    }
  },
};
