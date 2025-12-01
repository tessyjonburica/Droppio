const logLevels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
} as const;

type LogLevel = keyof typeof logLevels;

const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${logLevels[level]}]`;
  console[level](prefix, message, ...args);
};

export const logger = {
  info: (message: string, ...args: unknown[]) => log('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
};

