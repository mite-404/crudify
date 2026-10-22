# Troubleshooting

## Installation and runtime

### `Cannot find module 'ncrudify'`

Install the package:

```bash
npm install ncrudify
```

### Peer dependency warnings

Crudify expects:

```text
@nestjs/common ^12
@nestjs/core ^12
@nestjs/mongoose ^12
@nestjs/swagger ^12
class-transformer ^0.5
class-validator ^0.15
mongoose ^9
reflect-metadata ^0.2
rxjs ^7
```

Install the missing peer dependencies explicitly. Do not rely on transitive versions.

### `@Crudify requires options.model.type`

The `model.type` option is required:

```ts
@Crudify({
  model: {
    type: User,
  },
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

### Application fails at startup because MongoDB is unavailable

Crudify registers Mongoose models for configuration, health and audit data. Make sure `MongooseModule.forRoot()` is configured and MongoDB is reachable before the application starts.

## Routes

### Generated routes are missing

Check that:

1. The controller is registered in a NestJS module.
2. The module is imported in `AppModule`.
3. The controller extends `CrudifyController`.
4. The controller has `@Crudify({ model: { type: ... } })`.
5. The route is not listed in `routes.exclude`.
6. `routes.config[route].disabled` is not `true`.
7. Runtime configuration has not disabled the model or route.

### A route returns `403 Forbidden`

This usually comes from build-time configuration:

```ts
routes: {
  exclude: ["deleteBulk"],
  config: {
    update: { disabled: true },
  },
}
```

Excluded and disabled routes use `DisableRouteGuard`, which returns `403`.

### A route returns `{ success: false, status: 403 }` with HTTP `200`

This is the runtime configuration response. Check:

```bash
curl http://localhost:3000/config
```

Then inspect `enabled` and `routes` for the model. Use the correct model name (`model.type.name`) when calling:

```bash
curl -X PUT http://localhost:3000/config/User \
  -H "Content-Type: application/json" \
  -d '{"enabled":true,"routes":{"delete":true}}'
```

### Route order conflict with `/audit`, `/config` or `/health`

Import `CrudifyModule` before your own feature modules so its controllers are registered first. A custom catch-all controller such as `@Controller(":entity")` can capture paths like `/audit` if it is registered earlier in Express's route stack.

## Query parameters

### Filters are ignored

Enable the extended query parser in Express:

```ts
app.set("query parser", "extended");
```

Without it, `age[gte]=18` may not be parsed into `{ age: { gte: "18" } }`.

### Nested filters do not work

Use bracket notation exactly:

```
GET /users?profile.city[eq]=Milan
```

Do not use JSON inside a query string.

### Numeric-looking strings become numbers

`QueryParser.castValue()` converts numeric strings to numbers:

```
?zip=00123
```

becomes `123`. If a field must remain a string, override the service method or normalize the query before passing it to `QueryParser`.

### Unsafe fields are ignored

Field names starting with `$`, containing `__proto__`, `constructor` or `prototype`, or containing unsafe dot segments are ignored by design.

### Repeated parameters behave as `$in`

```
GET /users?status=active&status=pending
```

produces:

```ts
{ status: { $in: ["active", "pending"] } }
```

If you need exact array equality, use a custom service method.

## Find, count and soft delete

### `findAll` returns an empty array

Check the filter syntax and the generated query:

```
GET /users?age[gte]=18
```

Use `GET /users/count` with the same filters to verify how many documents match.

### `limit=0` returns every document

In Mongoose, `limit(0)` means "no limit". Crudify also treats `limit = 0` as no limit.

### `page` is unexpected

`page` is one-based:

```ts
page = limit > 0 ? Math.floor(skip / limit) + 1 : 1;
```

With `skip=20` and `limit=10`, `page` is `3`.

### Soft-deleted documents still appear

Soft delete only sets `deletedAt`. It does not add a global Mongoose filter. Add a filter:

```
GET /users?deletedAt[isnull]=true
```

Or override `findAll`, `findOne` and `count` in your service.

### `findOne` returns `null` instead of `404`

The default service methods return `null` when a document is not found. They do not throw `NotFoundException`. Override the controller or service if you need `404` responses.

### `PUT` removes fields that were not sent

`PUT` uses `findOneAndReplace`, which replaces the whole document. Use `PATCH` for partial updates.

### `PATCH /bulk` does not apply `$inc` or `$unset`

The bulk update service applies:

```ts
{ $set: updateDto }
```

`updateDto` must contain fields and values to set, not MongoDB update operators.

## Validation and DTOs

### Validation does not run

Crudify applies `ValidationPipe({ transform: true })` to the generated routes. Validation rules must be declared on the DTO or model with `class-validator` decorators.

```ts
export class CreateUserDto {
  @IsEmail()
  email!: string;
}
```

Pass the DTO to `@Crudify`:

```ts
model: {
  type: User,
  cdto: CreateUserDto,
  udto: UpdateUserDto,
}
```

### Swagger does not show the expected body

Check that `model.cdto` and `model.udto` are set and decorated with `@ApiProperty()`.

## Swagger

### Swagger UI is empty

- Install `@nestjs/swagger`.
- Call `SwaggerModule.createDocument()` after the application is created.
- Make sure the controller is registered in a module.
- Check that the route is not excluded or disabled at build time.

### Disabled routes do not appear

This is expected. Build-time excluded and disabled routes receive `@ApiExcludeEndpoint()`. Runtime-disabled routes remain visible because their state can change at runtime.

### Duplicate operation IDs

Crudify generates operation IDs as:

```
modelname_routeName
```

For example: `user_findAll`. If two controllers use the same model name, their operation IDs can collide. Use different model classes or override the Swagger metadata with route-specific decorators.

## Audit logging

### No audit records are created

Check:

1. `audit.enabled` is `true`.
2. `CrudifyModule.forRoot({ audit: { enabled: true } })` is used.
3. The request is not excluded by `@NoAudit()`.
4. The request is HTTP, not a WebSocket or RPC request.
5. MongoDB is writable.
6. The NestJS logger does not contain `Unable to store audit log`.

Audit writes are fire-and-forget. A failed insert does not fail the request, so inspect the logs.

### `user` is always `anonymous`

The default extractor looks at `request.user` and `request.userId`/`request.user_id`. Make sure your authentication guard runs before the interceptor and populates one of these fields.

Supported default fields:

```
request.user (string or number)
request.user._id
request.user.id
request.user.sub
request.user.email
request.userId
request.user_id
```

Use `userExtractor` for a custom source:

```ts
CrudifyModule.forRoot({
  audit: {
    enabled: true,
    userExtractor: (request) => request.headers["x-user-id"] as string,
  },
});
```

### `oldDocument` is missing

`oldDocument` is available only when:

1. The request is `PATCH`, `PUT` or `DELETE`.
2. The route has an `id` parameter.
3. The controller uses `@Crudify`, which stores `modelName` metadata.
4. The Mongoose model is registered.
5. The ID is valid enough for `findById`.

Collection routes, bulk routes and custom controllers without `@Crudify` do not have `oldDocument`.

### Audit logs are noisy

- Exclude routes at method or controller level with `@NoAudit()`.
- Exclude all `GET` requests with `@NoAudit("GET")`.
- Use `@NoAudit("GET/:id")` for detail routes.
- Add a TTL index to the collection.

### Audit collection grows indefinitely

Crudify does not create a TTL index. Create one manually:

```js
db.audit_logs.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);
```

### `GET /audit` does not work

Make sure `CrudifyModule.forRoot()` is imported and that no catch-all controller is intercepting `/audit` first. The audit controller is registered by `AuditModule` even when automatic logging is disabled.

## Configuration

### Configuration changes do not apply

- Use the model name from `model.type.name`, for example `User`, not the controller path.
- `PUT /config/:model` reloads the cache automatically.
- If you changed MongoDB manually, call `POST /config/reload`.
- Only `enabled`, `routes` and `props` are persisted by `ConfigService.updateConfig()`.

### `enabled: false` does not hide routes from Swagger

Runtime configuration is not reflected in Swagger. Use build-time `routes.exclude` or `routes.config[route].disabled` if a route must be removed from the generated OpenAPI document.

## Package and build

### `dist` is empty after a build

Run a clean build:

```bash
rm -rf dist
npm run build
```

The package `main` and `types` point to `dist/index.js` and `dist/index.d.ts`.

### `CrudifyModule.forRoot({ uri })` has no effect

The `uri` option is accepted for backward compatibility and currently ignored. Configure MongoDB with `MongooseModule.forRoot()`.

## Related documentation

- [Getting started](getting-started.md)
- [Routes](routes.md)
- [Query parser](query-parser.md)
- [Runtime configuration](config.md)
- [Audit logging](audit.md)
- [API reference](api-reference.md)
