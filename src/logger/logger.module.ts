import { DynamicModule, Module } from "@nestjs/common";
import "winston-daily-rotate-file";
import { CrudifyLogger } from "./logger.service";
import { APP_FILTER } from "@nestjs/core";
import { AllExceptionsFilter } from "./exception.filter";

@Module({
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
export class CrudifyLoggerModule {
  static forRoot(name: string): DynamicModule {
    return {
      module: CrudifyLoggerModule,
      providers: [
        {
          provide: CrudifyLogger,
          useValue: new CrudifyLogger(name),
        },
        {
          provide: "LOGGER",
          useClass: CrudifyLogger,
        },
      ],
      exports: [CrudifyLogger, CrudifyLogger],
    };
  }
}
