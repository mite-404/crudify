import { DynamicModule, Module, OnModuleInit } from "@nestjs/common";
import * as errsole from "errsole";
import ErrsoleMongoDB from "errsole-mongodb";
import { ILoggerModuleOptions } from "./logger.interface";

@Module({})
export class CrudifyLoggerModule implements OnModuleInit {
  private static options: ILoggerModuleOptions;
  static forRoot(options: ILoggerModuleOptions): DynamicModule {
    this.options = {
      uri: options.uri || "mongodb://localhost:27017",
      dbName: options.dbName || "logs",
    };
    return {
      module: CrudifyLoggerModule,
    };
  }

  onModuleInit() {
    const mongoUri =
      CrudifyLoggerModule.options?.uri || "mongodb://localhost:27017";
    const dbName = CrudifyLoggerModule.options?.dbName || "logs";
    if (!mongoUri) {
      throw new Error("MongoDB URI not found");
    }
    errsole.initialize({
      storage: new ErrsoleMongoDB(mongoUri, dbName!),
      ...CrudifyLoggerModule.options.options,
    });
  }
}
