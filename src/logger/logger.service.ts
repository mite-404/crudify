import { ConsoleLogger, Injectable, LoggerService } from "@nestjs/common";
import * as winston from "winston";

@Injectable()
export class CrudifyLogger extends ConsoleLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    super();
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: "DD-MM-YYYY, HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.printf(
        ({ timestamp, level, message, serviceName, context, trace }) => {
          const appName = "Crudify";
          const processId = process.pid;
          const service = serviceName || context || "UnknownService";
          if (trace) {
            return `[${appName}] ${processId} - ${timestamp} ${level.toUpperCase()} [${service}] ${message} - ${trace}`;
          }
          return `[${appName}] ${processId} - ${timestamp} ${level.toUpperCase()} [${service}] ${message}`;
        }
      )
    );

    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          level: "info",
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            customFormat
          ),
        }),
        new winston.transports.DailyRotateFile({
          level: "info",
          filename: "logs/%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: customFormat,
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  error(message: string, trace?: string, context?: string) {
    trace = trace || "";
    this.logger.error({ message, context: this.context || context, trace });
  }

  warn(message: string) {
    this.logger.warn({ message, context: this.context });
  }

  info(message: string) {
    this.logger.info({ message, context: this.context });
  }

  debug(message: string) {
    this.logger.debug({ message, context: this.context });
  }
}
