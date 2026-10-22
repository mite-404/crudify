# Audit Module

Crudify can persist an audit record for every HTTP request. Logging is **opt-in**
and disabled by default.

## Enable audit logging

```ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CrudifyModule } from "ncrudify";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    CrudifyModule.forRoot({
      audit: {
        enabled: true,
      },
    }),
  ],
})
export class AppModule {}
```

The interceptor is registered automatically as a global `APP_INTERCEPTOR` when
`audit.enabled` is `true`.

### Options

```ts
export interface IAuditOptions {
  enabled?: boolean;
  collectionName?: string;
  userExtractor?: (request: any) => string | null | undefined;
}
```

| Option           | Default        | Description                                                                 |
| ---------------- | -------------- | --------------------------------------------------------------------------- |
| `enabled`        | `false`        | Enables automatic request logging.                                          |
| `collectionName` | `audit_logs`   | MongoDB collection used to store audit records.                            |
| `userExtractor`  | built-in       | Custom function that extracts the user identifier from the request object. |

By default the user is resolved from `request.user._id`, `request.user.id`,
`request.user.sub`, `request.user.email`, `request.userId` or `request.user_id`.
If nothing is found, the value is `anonymous`.

## Stored record

```ts
export interface AuditLogRecord {
  user: string;
  action: string;
  entityId: string | null;
  details: Record<string, any>;
  createdAt?: Date | string;
}
```

Example:

```json
{
  "user": "694977f46f807ce321fda999",
  "action": "PATCH /api/finance/order/:id",
  "entityId": "6a6b3a0753210eef9724d6c7",
  "details": {
    "method": "PATCH",
    "url": "/api/finance/order/6a6b3a0753210eef9724d6c7",
    "payload": {
      "review": "Ok - Concordato condizioni di pagamento Ri.Ba 30 GG dffm",
      "job": []
    },
    "oldDocument": {
      "_id": "6a6b3a0753210eef9724d6c7",
      "review": "Ok - Concordato con cliente metodo pagamento Ri.Ba 30 GG dffm"
    },
    "statusCode": 200,
    "durationMs": 32
  }
}
```

- `action` is normalized as `METHOD /path/:param`.
- `entityId` comes from `request.params.id`, or from the response `_id`/`id`
  for create operations.
- `oldDocument` is loaded before `PATCH`, `PUT` and `DELETE` requests when the
  target Mongoose model can be resolved from the `@Crudify` metadata.
- Failed requests are logged too, with `statusCode` and `error` in `details`.
- Audit write failures are logged but never break the original request.

## Excluding routes

Use `@NoAudit()` on a method to exclude it completely, or pass one or more
action patterns:

```ts
import { Controller, Get } from "@nestjs/common";
import { NoAudit } from "ncrudify";

@Controller("users")
export class UsersController {
  @NoAudit("GET/:id")
  @Get(":id")
  findOne() {
    // ...
  }

  @NoAudit("GET", "DELETE/:id")
  @Get("search")
  search() {
    // ...
  }
}
```

The decorator can also be applied to a controller:

```ts
@NoAudit("GET/:id", "DELETE/:id")
@Controller("users")
export class UsersController {}
```

Supported patterns:

- `@NoAudit()` — excludes the decorated method or whole controller.
- `@NoAudit("GET")` — excludes every `GET` request.
- `@NoAudit("GET/:id")` — matches actions whose path ends with `/:id`.
- `@NoAudit("GET /api/users/:id")` — exact normalized action.
- `@NoAudit("/api/users/:id")` — path-only match.
- `@NoAudit("findOne")` — matches the handler method name.

The `/audit` endpoints themselves are excluded from audit logging.

## Reading audit logs

When audit is enabled, the module exposes:

- `GET /audit` — list logs. Supports `limit`, `skip`, `sort` and the same
  filter operators used by Crudify.
- `GET /audit/:id` — retrieve a single log.

### Manual logging

Inject `AuditService` to write records manually:

```ts
import { Injectable } from "@nestjs/common";
import { AuditService } from "ncrudify";

@Injectable()
export class OrderService {
  constructor(private readonly auditService: AuditService) {}

  async approve(orderId: string, userId: string) {
    await this.auditService.log({
      user: userId,
      action: "APPROVE /orders/:id",
      entityId: orderId,
      details: { method: "APPROVE" },
    });
  }
}
```

## Notes

- Logging every request can produce a large collection. Consider a TTL index or
  retention policy on `audit_logs` if you need automatic cleanup.
- The built-in `AuditController` is available even when automatic logging is
  disabled, so manual log entries can still be read.
