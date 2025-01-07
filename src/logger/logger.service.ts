import { ConsoleLogger, Injectable, LoggerService } from "@nestjs/common";

//TODO: da riadattare a errsole
@Injectable()
export class CrudifyLogger extends ConsoleLogger implements LoggerService {
  private name: string = "Crudify";

  constructor(name?: string) {
    super();
    if (name) this.name = name;
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  error(message: string, trace?: string, context?: string) {
    trace = trace || "";
  }

  warn(message: string) {}

  info(message: string) {}
}
