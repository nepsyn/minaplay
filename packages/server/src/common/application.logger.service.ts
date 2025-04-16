import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { ConsoleLoggerOptions } from '@nestjs/common/services/console-logger.service.js';

export class ApplicationLogger extends ConsoleLogger {
  private static messages: string[] = [];

  constructor(context: string = 'APP', options?: ConsoleLoggerOptions) {
    super(context, {
      ...options,
      prefix: 'MinaPlay',
    });
  }

  public static addHistoryMessage(message: string) {
    if (this.messages.length > 512) {
      this.messages.shift();
    }
    this.messages.push(message);
  }

  public static getHistoryMessages() {
    return [].concat(this.messages);
  }

  public static clearMessages() {
    this.messages = [];
  }

  protected printMessages(
    messages: unknown[],
    context?: string,
    logLevel?: LogLevel,
    writeStreamType?: 'stdout' | 'stderr',
  ) {
    messages.forEach((message) => {
      const pidMessage = this.formatPid(process.pid);
      const contextMessage = this.formatContext(context);
      const timestampDiff = this.updateAndGetTimestampDiff();
      const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');
      const formattedMessage = this.formatMessage(
        logLevel,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        timestampDiff,
      );

      ApplicationLogger.addHistoryMessage(formattedMessage);
      process[writeStreamType ?? 'stdout'].write(formattedMessage);
    });
  }
}
