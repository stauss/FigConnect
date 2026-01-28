type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      // Use console.error for stdio transport (stdout is for JSON-RPC)
      console.error(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      // Use console.error for stdio transport (stdout is for JSON-RPC)
      console.error(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      // Use console.error for stdio transport (stdout is for JSON-RPC)
      console.error(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      // Use console.error for stdio transport (stdout is for JSON-RPC)
      console.error(`[ERROR] ${message}`, error);
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL as LogLevel);
