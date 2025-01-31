import { CONST } from "../../shared/const.namespace";
import {
  ILoggerModuleOptions,
  LoggerModuleOptions,
} from "../../logger/logger.interface";

export interface ICrudifyModuleOptions {
  uri?: string;
  logger?: ILoggerModuleOptions;
}

export class CrudifyModuleOptions implements ICrudifyModuleOptions {
  uri?: string;
  logger: LoggerModuleOptions;

  constructor(options: ICrudifyModuleOptions) {
    this.uri = options?.uri || CONST.MONGO_URI;
    this.logger = new LoggerModuleOptions(options?.logger, this.uri);
  }
}
