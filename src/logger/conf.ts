import * as winston from "winston";

export namespace LoggerConf {
  export const fomats: winston.Logform.Format[] = [
    winston.format.timestamp({ format: "DD-MM-YYYY, HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
      ({ timestamp, level, message, name, context, trace }) => {
        const appName = name || "Crudify";
        const processId = process.pid;
        const service = context || "UnknownService";
        if (trace) {
          return `[${appName}] ${processId} - ${timestamp} ${level.toUpperCase()} [${service}] ${message} - ${trace}`;
        }
        return `[${appName}] ${processId} - ${timestamp} ${level.toUpperCase()} [${service}] ${message}`;
      }
    ),
  ];

  export const transports = [
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        ...LoggerConf.fomats
      ),
    }),
    new winston.transports.DailyRotateFile({
      level: "info",
      filename: "/workspace/logs/%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: winston.format.combine(...LoggerConf.fomats),
    }),
  ];
}
