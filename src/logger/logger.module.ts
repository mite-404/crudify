import { LoggerModuleOptions } from "./logger.interface";
import * as errsole from "errsole";

export class CrudifyLoggerModule {
  initModule(options: LoggerModuleOptions) {
    if (options?.disabled) return;
    if (!options.uri) {
      throw new Error("MongoDB URI not found");
    }
    errsole.initialize(options.options);
  }
}
