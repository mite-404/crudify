# Migration to 1.5.0

Crudify `1.5.0` adds opt-in audit logging and a complete documentation set. There are no breaking API changes.

## Summary

| Change                         | Impact                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| New audit module               | Opt-in. Automatic logging is disabled by default.             |
| New `@NoAudit()` decorator     | Optional. No effect unless audit logging is enabled.          |
| New `GET /audit` endpoints     | Registered by `CrudifyModule.forRoot()`.                      |
| New `AuditService`             | Injectable globally through the global `AuditModule`.         |
| Documentation rewrite          | Documentation only.                                           |
| Version                        | `1.4.1` → `1.5.0`.                                            |

## Do I need to change my code?

No, unless you want to enable audit logging.

Existing `CrudifyModule.forRoot()` calls continue to work:

```ts
CrudifyModule.forRoot();
```

Automatic audit logging remains disabled.

## Enable audit logging

```ts
CrudifyModule.forRoot({
  audit: {
    enabled: true,
  },
});
```

Or:

```ts
CrudifyModule.forRoot({ audit: true });
```

The audit module registers a global interceptor and stores records in the `audit_logs` collection.

### Recommended rollout

1. Enable audit logging in a development or staging environment.
2. Verify that `request.user` is populated by your authentication guards.
3. Configure `userExtractor` if your user identifier is stored elsewhere.
4. Exclude noisy or sensitive routes with `@NoAudit()`.
5. Protect `GET /audit` and `GET /audit/:id` with authentication and authorization.
6. Add a TTL index if you need automatic retention:

```js
db.audit_logs.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);
```

## What gets logged

All HTTP requests are logged when audit is enabled, except:

- Requests excluded by `@NoAudit()`.
- The built-in `/audit` controller.

Each record contains:

```ts
{
  user: string;
  action: string;
  entityId: string | null;
  details: {
    method: string;
    url: string;
    payload: any;
    oldDocument?: any;
    statusCode: number;
    durationMs: number;
    error?: {
      name: string;
      message: string;
      statusCode: number;
    };
  };
  createdAt: Date;
}
```

## Excluding routes

```ts
import { NoAudit } from "ncrudify";

@NoAudit("GET/:id")
@Get(":id")
findOne() {
  // ...
}
```

Or exclude a whole controller:

```ts
@NoAudit()
@Controller("internal")
export class InternalController {}
```

See [Audit logging](audit.md) for all patterns.

## Behavior changes

- `CrudifyModule.forRoot()` now imports `AuditModule`.
- `AuditService` and the audit controller are available even when automatic logging is disabled.
- The audit interceptor adds one `findById` read for `PATCH`, `PUT` and `DELETE` requests when the model can be resolved. This is required to capture `oldDocument`.
- Audit writes are fire-and-forget and do not block responses.

## New public exports

```ts
AuditController
AuditInterceptor
AuditLog
AuditLogSchema
AuditModule
AuditService
NoAudit
createAuditLogSchema
AuditLogRecord
AuditUserExtractor
IAuditOptions
```

## Documentation

The documentation now includes:

- [Getting started](getting-started.md)
- [Crudify decorator](crudify-decorator.md)
- [Routes](routes.md)
- [Query parser](query-parser.md)
- [Runtime configuration](config.md)
- [Audit logging](audit.md)
- [Swagger](swagger.md)
- [Exceptions](exceptions.md)
- [Health](health.md)
- [API reference](api-reference.md)
- [Troubleshooting](troubleshooting.md)

## Verification

After upgrading:

```bash
npm test
npm run build
```

The release test suite covers the query parser, configuration service, CRUD service/controller, exception filter and audit module.
