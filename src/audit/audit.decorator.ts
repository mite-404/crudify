import "reflect-metadata";
import { NO_AUDIT_METADATA } from "./audit.constants";

/**
 * Excludes a route or a whole controller from audit logging.
 *
 * Use it without arguments to skip the decorated method, or with one or more
 * action strings to skip only the matching actions:
 *
 * ```ts
 * @NoAudit("GET/:id")
 * findOne() { ... }
 *
 * @NoAudit("GET/:id", "DELETE/:id")
 * @Controller("users")
 * class UsersController {}
 * ```
 */
export function NoAudit(
  ...actions: string[]
): ClassDecorator & MethodDecorator {
  return ((target: any, propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor) => {
    const metadataTarget =
      propertyKey !== undefined && descriptor
        ? descriptor.value
        : target;
    const existing: string[] =
      Reflect.getMetadata(NO_AUDIT_METADATA, metadataTarget) ?? [];
    const values = actions.length > 0 ? actions : ["*"];

    Reflect.defineMetadata(
      NO_AUDIT_METADATA,
      [...existing, ...values],
      metadataTarget
    );
  }) as ClassDecorator & MethodDecorator;
}
