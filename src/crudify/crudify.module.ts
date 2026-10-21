import { DynamicModule, Module } from "@nestjs/common";

import {
  CrudifyModuleOptions,
  ICrudifyModuleOptions,
} from "./interface/crudifyoptions.interface";
import { HealthModule } from "../health/health.module";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [HealthModule, ConfigModule],
})
export class CrudifyModule {
  private static options: CrudifyModuleOptions;
  static forRoot(options: ICrudifyModuleOptions): DynamicModule {
    this.options = new CrudifyModuleOptions(options);
    return {
      module: CrudifyModule,
    };
  }
}
