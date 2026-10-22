# Runtime configuration

Crudify can enable or disable a model or individual CRUD routes at runtime. Configuration is stored in MongoDB and cached in memory by `ConfigService`.

This is different from `@Crudify({ routes: { exclude: [...] } })`, which is evaluated when the application starts. Runtime configuration can change while the application is running.

## How it works

1. `ConfigModule` registers the `Config` Mongoose model.
2. `ConfigService` loads all documents when the application starts (`OnModuleInit`).
3. The cache is consulted by `CrudifyController` before every CRUD operation.
4. `PUT /config/:model` and `POST /config/reload` update the database and reload the cache.

`ConfigModule` is global, so `ConfigService` can be injected anywhere.

## `Config` entity

```ts
@Schema({ timestamps: true })
export class Config extends Document {
  @Prop({ required: true, unique: true })
  modelName!: string;

  @Prop({ type: Object })
  routes?: Partial<Record<ControllerMethods, boolean>>;

  @Prop({ default: true })
  enabled?: boolean;

  @Prop({ type: Object })
  props?: Partial<Record<string, any>>;
}
```

### Example document

```json
{
  "modelName": "User",
  "enabled": true,
  "routes": {
    "create": true,
    "createBulk": true,
    "findAll": true,
    "findOne": true,
    "put": true,
    "update": true,
    "updateBulk": true,
    "delete": false,
    "deleteSoft": true,
    "deleteBulk": false,
    "restore": true,
    "restoreBulk": true,
    "count": true
  },
  "props": {
    "group": "admin"
  },
  "createdAt": "2026-10-22T10:00:00.000Z",
  "updatedAt": "2026-10-22T10:05:00.000Z"
}
```

### Route names

The `routes` object accepts the following keys:

```
create
createBulk
findAll
findOne
put
update
updateBulk
delete
deleteSoft
deleteBulk
restore
restoreBulk
count
```

Unknown keys are stored but ignored by `isRouteEnabled`.

## `ConfigService`

```ts
@Injectable()
export class ConfigService {
  load(): Promise<void>;
  isRouteEnabled(model: string, route: string): boolean;
  getAll(): Record<string, any>;
  updateConfig(model: string, updates?: {
    enabled?: boolean;
    routes?: Partial<Record<ControllerMethods, boolean>>;
    props?: Partial<Record<string, any>>;
  }): Promise<void>;
  notEnabledResponse(modelName: string, route: string): {
    success: false;
    status: 403;
    message: string;
  };
}
```

### `load()`

Reads every `Config` document and rebuilds the in-memory cache.

```ts
await configService.load();
```

`ConfigService` calls `load()` automatically during `onModuleInit`.

### `isRouteEnabled(model, route)`

Returns whether a route is enabled for a model.

Logic:

1. If no configuration exists for the model, return `true`.
2. If `enabled === false`, return `false` for every route.
3. Otherwise return `routes[route]`, defaulting to `true`.

```ts
if (!this.configService.isRouteEnabled("User", "delete")) {
  return this.configService.notEnabledResponse("User", "delete");
}
```

### `getAll()`

Returns a copy of the current cache:

```json
{
  "User": {
    "enabled": true,
    "routes": {
      "delete": false
    },
    "props": {
      "group": "admin"
    }
  }
}
```

### `updateConfig(model, updates)`

Creates or updates the configuration for a model. Only these fields are persisted:

- `enabled`
- `routes`
- `props`

`modelName` cannot be changed through this method. If no allowed field is present, the method returns without writing.

```ts
await this.configService.updateConfig("User", {
  enabled: true,
  routes: { delete: false },
  props: { group: "admin" },
});
```

### `notEnabledResponse(modelName, route)`

Returns the response used by `CrudifyController` when a runtime route is disabled:

```json
{
  "success": false,
  "status": 403,
  "message": "The route 'delete' for model 'User' is currently disabled."
}
```

## `ConfigController`

Base path: `/config`

### `GET /config`

Returns the current configuration cache.

```bash
curl http://localhost:3000/config
```

```json
{
  "User": {
    "enabled": true,
    "routes": {
      "delete": false
    },
    "props": {
      "group": "admin"
    }
  }
}
```

### `PUT /config/:model`

Creates or updates the configuration for a model and reloads the cache.

```bash
curl -X PUT http://localhost:3000/config/User \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "routes": {
      "create": true,
      "delete": false,
      "deleteBulk": false
    },
    "props": {
      "group": "admin"
    }
  }'
```

The `:model` path parameter must match the model name used by `@Crudify`, which is `model.type.name` (for example `User`).

Response:

```json
{
  "success": true,
  "model": "User",
  "updates": {
    "enabled": true,
    "routes": {
      "create": true,
      "delete": false,
      "deleteBulk": false
    },
    "props": {
      "group": "admin"
    }
  }
}
```

The record is created with an upsert if it does not exist.

### `POST /config/reload`

Reloads the cache from MongoDB.

```bash
curl -X POST http://localhost:3000/config/reload
```

```json
{
  "success": true,
  "message": "Configuration cache reloaded."
}
```

## Disabling a whole model

```bash
curl -X PUT http://localhost:3000/config/User \
  -H "Content-Type: application/json" \
  -d '{"enabled":false}'
```

Every route for `User` returns the disabled-route response, regardless of individual route flags.

## Runtime response vs build-time blocking

Runtime configuration does not throw an HTTP exception. `CrudifyController` returns the `notEnabledResponse` object, so the HTTP status is normally `200` and the body contains `status: 403`.

Build-time `routes.exclude` and `routes.config[route].disabled` use `DisableRouteGuard`, which blocks the request with an actual `403 Forbidden`.

| Mechanism                                        | When evaluated | HTTP result                         |
| ------------------------------------------------ | -------------- | ----------------------------------- |
| `routes.exclude`                                 | Build time     | `403 Forbidden`                     |
| `routes.config[route].disabled`                  | Build time     | `403 Forbidden`                     |
| `Config.enabled: false`                          | Runtime        | `200` with `status: 403` in body    |
| `Config.routes[route]: false`                    | Runtime        | `200` with `status: 403` in body    |

## Security

The `/config` endpoints are not protected by Crudify. Protect them with your own authentication and authorization guards, for example by applying a global guard or by wrapping the controller in your application.

## Related documentation

- [Routes](routes.md)
- [Crudify decorator](crudify-decorator.md)
- [API reference](api-reference.md)
- [Troubleshooting](troubleshooting.md)
