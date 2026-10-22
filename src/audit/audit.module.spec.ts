import { APP_INTERCEPTOR } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { AuditInterceptor } from "./audit.interceptor";
import { AuditModule } from "./audit.module";
import { AuditService } from "./audit.service";

describe("AuditModule", () => {
  it("does not register the interceptor when audit is disabled", () => {
    const module = AuditModule.forRoot();
    const providers = module.providers ?? [];

    expect(
      providers.some(
        (provider: any) => provider?.provide === APP_INTERCEPTOR
      )
    ).toBe(false);
    expect(providers).toContain(AuditService);
  });

  it("registers the interceptor when audit is enabled", () => {
    const module = AuditModule.forRoot({ enabled: true });
    const providers = module.providers ?? [];

    expect(providers).toContainEqual({
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    });
  });
});
