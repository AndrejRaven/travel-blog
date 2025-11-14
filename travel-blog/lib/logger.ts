/**
 * System logowania z poziomami
 */

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production";

  private log(level: LogLevel, message: string, data?: unknown) {
    if (level === "debug" && !this.isDevelopment) {
      return; // Nie loguj debug w production
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case "error":
        console.error(logMessage, data);
        break;
      case "warn":
        console.warn(logMessage, data);
        break;
      case "info":
        if (this.isDevelopment) {
          console.log(logMessage, data);
        }
        break;
      case "debug":
        if (this.isDevelopment) {
          console.log(logMessage, data);
        }
        break;
    }
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, error?: unknown) {
    // Nie loguj pełnych błędów w production - tylko podstawowe info
    const safeError = this.isDevelopment
      ? error
      : error instanceof Error
      ? { message: error.message, name: error.name }
      : "Unknown error";

    this.log("error", message, safeError);
  }
}

export const logger = new Logger();

