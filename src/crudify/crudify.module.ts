import { DynamicModule, Module } from "@nestjs/common";

import { ICrudifyModuleOptions } from "./interface/crudifyoptions.interface";
import { HealthModule } from "../health/health.module";
import { ConfigModule } from "../config/config.module";
import { AuditModule } from "../audit/audit.module";
import { IAuditOptions } from "../audit/audit.interface";

@Module({
  imports: [HealthModule, ConfigModule],
})
export class CrudifyModule {
  static forRoot(
    options: ICrudifyModuleOptions = {}
  ): DynamicModule {
    return {
      module: CrudifyModule,
      imports: [AuditModule.forRoot(resolveAuditOptions(options.audit))],
    };
  }
}

function resolveAuditOptions(
  audit: boolean | IAuditOptions | undefined
): IAuditOptions {
  if (typeof audit === "boolean") return { enabled: audit };
  return { enabled: false, ...(audit ?? {}) };
}
