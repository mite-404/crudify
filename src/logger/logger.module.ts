import { Module } from "@nestjs/common";
import { LoggerModuleOptions } from "./logger.interface";
import * as errsole from "errsole";
import { LoggerController } from "./logger.controller";
@Module({
  controllers: [LoggerController],
  providers: [],
})
export class LoggerModule {
  initModule(options: LoggerModuleOptions) {
    if (options?.disabled) return;
    if (!options.uri) {
      throw new Error("MongoDB URI not found");
    }
    errsole.initialize(options.options);
  }
}
