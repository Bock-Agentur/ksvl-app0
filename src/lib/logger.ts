/**
 * Robustes Logging-System für Entwicklung und Production
 * Ersetzt alle console.log Statements mit konfigurierbarem Logger
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.logLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, category: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };
  }

  private storeLog(entry: LogEntry): void {
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
    this.logs.push(entry);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    return `[${timestamp}] [${levelStr}] [${entry.category}] ${entry.message}`;
  }

  debug(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, data);
    this.storeLog(entry);
    
    if (!this.isProduction) {
      console.log(this.formatMessage(entry), data || '');
    }
  }

  info(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, category, message, data);
    this.storeLog(entry);
    
    if (!this.isProduction) {
      console.info(this.formatMessage(entry), data || '');
    }
  }

  warn(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, category, message, data);
    this.storeLog(entry);
    console.warn(this.formatMessage(entry), data || '');
  }

  error(category: string, message: string, error?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, error);
    this.storeLog(entry);
    console.error(this.formatMessage(entry), error || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience methods for different categories
export const slotLogger = {
  debug: (message: string, data?: any) => logger.debug('SLOT', message, data),
  info: (message: string, data?: any) => logger.info('SLOT', message, data),
  warn: (message: string, data?: any) => logger.warn('SLOT', message, data),
  error: (message: string, error?: any) => logger.error('SLOT', message, error),
};

export const userLogger = {
  debug: (message: string, data?: any) => logger.debug('USER', message, data),
  info: (message: string, data?: any) => logger.info('USER', message, data),
  warn: (message: string, data?: any) => logger.warn('USER', message, data),
  error: (message: string, error?: any) => logger.error('USER', message, error),
};

export const apiLogger = {
  debug: (message: string, data?: any) => logger.debug('API', message, data),
  info: (message: string, data?: any) => logger.info('API', message, data),
  warn: (message: string, data?: any) => logger.warn('API', message, data),
  error: (message: string, error?: any) => logger.error('API', message, error),
};

export const uiLogger = {
  debug: (message: string, data?: any) => logger.debug('UI', message, data),
  info: (message: string, data?: any) => logger.info('UI', message, data),
  warn: (message: string, data?: any) => logger.warn('UI', message, data),
  error: (message: string, error?: any) => logger.error('UI', message, error),
};