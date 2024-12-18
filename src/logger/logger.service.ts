import { ConsoleLogger, Injectable, LoggerService } from "@nestjs/common";
import * as winston from "winston";
import { LoggerConf } from "./conf";

@Injectable()
export class CrudifyLogger extends ConsoleLogger implements LoggerService {
  private readonly logger: winston.Logger;
  private name: string = "Crudify";

  constructor(name?: string) {
    super();
    if (name) this.name = name;
    this.logger = winston.createLogger({
      transports: LoggerConf.transports,
    });
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  error(message: string, trace?: string, context?: string) {
    trace = trace || "";
    this.logger.error({
      message,
      context: this.context || context,
      trace,
      name: this.name,
    });
  }

  warn(message: string) {
    this.logger.warn({ message, context: this.context, name: this.name });
  }

  info(message: string) {
    this.logger.info({ message, context: this.context, name: this.name });
  }
}
