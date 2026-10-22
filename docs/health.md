# Health check

`CrudifyModule` exposes a health endpoint that checks the application and the MongoDB connection.

## `GET /health`

### Healthy response

```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2026-10-22T10:00:00.000Z"
}
```

HTTP status: `200 OK`.

### Unhealthy response

When MongoDB is not connected, the endpoint throws `ServiceUnavailableException` with the health payload:

```json
{
  "status": "ERROR",
  "database": "Disconnected",
  "timestamp": "2026-10-22T10:00:00.000Z"
}
```

HTTP status: `503 Service Unavailable`.

## Database states

The endpoint inspects the Mongoose connection `readyState`.

| `readyState` | Reported value  |
| ------------ | --------------- |
| `0`          | `Disconnected`  |
| `1`          | `Connected`     |
| `2`          | `Connecting`    |
| `3`          | `Disconnecting` |
| `99`         | `Uninitialized` |
| other        | `Unknown`       |

Only `Connected` is considered healthy.

## Requirements

The health controller injects the Mongoose connection:

```ts
@InjectConnection() private readonly connection: Connection
```

The application must configure `MongooseModule.forRoot()`.

## Audit logging

If audit logging is enabled, `GET /health` is audited like any other HTTP request, unless you exclude it. The built-in health controller does not use `@NoAudit()`.

## Swagger

The health endpoint is documented with the `Health Check` tag and the `HealthResponse` schema. See [Swagger](swagger.md) for the Swagger setup.

## Related documentation

- [Getting started](getting-started.md)
- [Runtime configuration](config.md)
- [Troubleshooting](troubleshooting.md)
