import ErrsoleMongoDB from "errsole-mongodb";

export interface ILoggerModuleOptions {
  disabled?: boolean;
  uri?: string;
  dbName?: string;
  options?: Errsole.Options;
}

export class LoggerModuleOptions implements ILoggerModuleOptions {
  disabled?: boolean;
  uri: string;
  dbName: string;
  options: Errsole.Options;

  constructor(options: ILoggerModuleOptions | undefined, uri: string) {
    this.disabled = options?.disabled;
    this.uri = options?.uri || uri;
    this.dbName = options?.dbName || "logs";
    this.options = options?.options || { storage: null };
    this.options!.storage = new ErrsoleMongoDB(this.uri, this.dbName);
  }
}
