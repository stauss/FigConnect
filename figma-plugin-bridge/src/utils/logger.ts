/**
 * Logger utility for the Figma plugin
 */
export class Logger {
  private context: string;
  private enabled: boolean;

  constructor(context: string, enabled: boolean = true) {
    this.context = context;
    this.enabled = enabled;
  }

  private format(level: string, message: string): string {
    const timestamp = new Date().toISOString().slice(11, 23);
    return `[${timestamp}] [${this.context}] ${level}: ${message}`;
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.enabled) return;
    console.log(this.format("INFO", message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.enabled) return;
    console.warn(this.format("WARN", message), ...args);
  }

  error(message: string, error?: unknown): void {
    if (!this.enabled) return;
    console.error(this.format("ERROR", message), error);
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.enabled) return;
    console.log(this.format("DEBUG", message), ...args);
  }

  /**
   * Show a notification in Figma
   */
  notify(message: string, options?: NotificationOptions): void {
    figma.notify(message, options);
  }

  /**
   * Show an error notification
   */
  notifyError(message: string): void {
    figma.notify(message, { error: true });
  }
}

// Default logger instance
export const logger = new Logger("MCP Bridge");
