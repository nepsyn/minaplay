import { ConsoleLogger, LogLevel } from '@nestjs/common';

export class ApplicationLogger extends ConsoleLogger {
  private static messages: string[] = [];

  public static addHistoryMessage(message: string) {
    if (this.messages.length > 255) {
      this.messages.shift();
    }
    this.messages.push(message);
  }

  public static getHistoryMessages() {
    return [].concat(this.messages);
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
