import { DynamicModule, Module, OnModuleInit } from "@nestjs/common";

import {
  CrudifyModuleOptions,
  ICrudifyModuleOptions,
} from "./interface/crudifyoptions.interface";
import { CrudifyLoggerModule } from "../logger/logger.module";

@Module({})
export class CrudifyModule implements OnModuleInit {
  private static options: CrudifyModuleOptions;
  static forRoot(options: ICrudifyModuleOptions): DynamicModule {
    this.options = new CrudifyModuleOptions(options);
    return {
      module: CrudifyModule,
    };
  }

  onModuleInit() {
    new CrudifyLoggerModule().initModule(CrudifyModule.options.logger);
  }
}
