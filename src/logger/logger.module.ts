import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import "winston-daily-rotate-file";
import { CrudifyLogger } from "./logger.service";
import { APP_FILTER } from "@nestjs/core";
import { AllExceptionsFilter } from "./exception.filter";

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          level: "info",
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.DailyRotateFile({
          level: "info",
          filename: "logs/%DATE%.log",
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
        }),
      ],
    }),
  ],
  providers: [
    CrudifyLogger,
    {
      provide: "LOGGER",
      useClass: CrudifyLogger,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [CrudifyLogger],
})
export class CrudifyLoggerModule {}
