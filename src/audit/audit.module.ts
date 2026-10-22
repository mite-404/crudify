import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { AUDIT_LOG_MODEL, AUDIT_OPTIONS } from "./audit.constants";
import { AuditController } from "./audit.controller";
import { createAuditLogSchema } from "./audit.entity";
import { AuditInterceptor } from "./audit.interceptor";
import { IAuditOptions } from "./audit.interface";
import { AuditService } from "./audit.service";

@Global()
@Module({})
export class AuditModule {
  static forRoot(options: IAuditOptions = {}): DynamicModule {
    const auditOptions: IAuditOptions = {
      enabled: false,
      ...options,
    };

    const providers: Provider[] = [
      AuditService,
      { provide: AUDIT_OPTIONS, useValue: auditOptions },
    ];

    if (auditOptions.enabled) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: AuditInterceptor,
      });
    }

    return {
      module: AuditModule,
      imports: [
        MongooseModule.forFeature([
          {
            name: AUDIT_LOG_MODEL,
            schema: createAuditLogSchema(auditOptions.collectionName),
          },
        ]),
      ],
      controllers: [AuditController],
      providers,
      exports: [AuditService],
    };
  }
}
