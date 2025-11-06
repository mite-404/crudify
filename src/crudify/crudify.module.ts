import { DynamicModule, Module, OnModuleInit } from "@nestjs/common";

import {
  CrudifyModuleOptions,
  ICrudifyModuleOptions,
} from "./interface/crudifyoptions.interface";
import { LoggerModule } from "../logger/logger.module";
import { HealthModule } from "../health/health.module";

@Module({
  imports: [HealthModule, LoggerModule],
})
export class CrudifyModule implements OnModuleInit {
  private static options: CrudifyModuleOptions;
  static forRoot(options: ICrudifyModuleOptions): DynamicModule {
    this.options = new CrudifyModuleOptions(options);
    return {
      module: CrudifyModule,
    };
  }

  onModuleInit() {
    new LoggerModule().initModule(CrudifyModule.options.logger);
  }
}
