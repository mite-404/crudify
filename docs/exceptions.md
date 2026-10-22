# Exception handling

`CrudifyController` is decorated with `@UseFilters(CrudifyExceptionFilter)`. The filter converts common application, Mongoose and NestJS errors into a consistent JSON response.

`CrudifyExceptionFilter` is applied to `CrudifyController`. It is not registered globally; custom controllers use NestJS's default exception handling unless you apply the filter yourself.

## Response shape

```json
{
  "statusCode": 400,
  "message": "Cast to ObjectId failed for value \"abc\" at path \"_id\"",
  "error": "Bad Request"
}
```

| Field        | Description                                      |
| ------------ | ------------------------------------------------ |
| `statusCode` | HTTP status code.                                |
| `message`    | Error message or an array of validation messages.|
| `error`      | Short error name.                                |

## Error mapping

| Error                                      | HTTP status | `error`                 |
| ------------------------------------------ | ----------- | ----------------------- |
| `HttpException`                            | Its status  | From the exception      |
| Mongoose `CastError`                       | `400`       | `Bad Request`           |
| Mongoose `ValidationError`                 | `400`       | `Bad Request`           |
| Duplicate key (`code === 11000`)           | `409`       | `Conflict`              |
| Any other error                            | `500`       | `Internal Server Error` |

## `HttpException`

The filter preserves NestJS exceptions:

```ts
throw new NotFoundException("User not found");
```

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

If the exception response contains a `message` array, it is preserved:

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "name should not be empty"],
  "error": "Bad Request"
}
```

## Mongoose `CastError`

Invalid ObjectIds, invalid numbers and similar cast failures become `400 Bad Request`:

```
GET /users/not-an-object-id
```

```json
{
  "statusCode": 400,
  "message": "Cast to ObjectId failed for value \"not-an-object-id\" at path \"_id\"",
  "error": "Bad Request"
}
```

## Mongoose `ValidationError`

Schema validation failures become `400 Bad Request`:

```json
{
  "statusCode": 400,
  "message": "User validation failed: email: Path `email` is required.",
  "error": "Bad Request"
}
```

## Duplicate key

A MongoDB duplicate key error (`E11000`, code `11000`) becomes `409 Conflict`:

```json
{
  "statusCode": 409,
  "message": "A record with the same unique value already exists",
  "error": "Conflict"
}
```

## Unknown errors

Unknown errors are hidden behind a generic message:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

Use your application logger or an additional exception filter if you need to inspect the original error in production.

## Using the filter in custom controllers

```ts
import { Controller, UseFilters } from "@nestjs/common";
import { CrudifyExceptionFilter } from "ncrudify";

@UseFilters(CrudifyExceptionFilter)
@Controller("custom")
export class CustomController {}
```

You can also register it globally:

```ts
import { APP_FILTER } from "@nestjs/core";
import { CrudifyExceptionFilter } from "ncrudify";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: CrudifyExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## Null results are not exceptions

The default `CrudifyService` methods return `null` when a document is not found:

- `findOne`
- `update`
- `put`
- `delete`
- `softDelete`
- `restore`

They do not throw `NotFoundException` automatically. If you need `404` responses, override the service methods or the controller methods and throw the appropriate exception.

## Related documentation

- [Routes](routes.md)
- [API reference](api-reference.md)
- [Troubleshooting](troubleshooting.md)
