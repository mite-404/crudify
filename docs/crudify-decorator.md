# The `@Crudify` decorator

`@Crudify()` generates CRUD route decorators and Swagger metadata for a controller that extends `CrudifyController`.

## Basic usage

```ts
import { Controller } from "@nestjs/common";
import { Crudify, CrudifyController } from "ncrudify";
import { User, UserSchema } from "./entities/user.entity";
import { UserService } from "./user.service";

@Crudify({
  model: {
    type: User,
    schema: UserSchema,
  },
})
@Controller("users")
export class UserController extends CrudifyController<User> {
  constructor(public readonly service: UserService) {
    super(service);
  }
}
```

`model.type` is required. If it is missing, `@Crudify` throws:

```
@Crudify requires options.model.type
```

## Interface

```ts
export interface ICrudify {
  model: ICrudifyModel;
  routes?: ICrudifyRoutes;
  softDelete?: boolean;
}

export interface ICrudifyModel {
  type: Type;
  cdto?: Type;
  udto?: Type;
  schema?: Schema;
}

export interface ICrudifyRoutes {
  config?: Partial<Record<ControllerMethods, IRouteConfig>>;
  exclude?: ControllerMethods[];
  decorators?: MethodDecorator[];
  disableBulk?: boolean;
}

export interface IRouteConfig {
  decorators?: MethodDecorator[];
  disabled?: boolean;
}

export type ControllerMethods =
  | "create"
  | "createBulk"
  | "findAll"
  | "findOne"
  | "put"
  | "update"
  | "updateBulk"
  | "delete"
  | "deleteSoft"
  | "deleteBulk"
  | "restore"
  | "restoreBulk"
  | "count";
```

## `model`

### `model.type`

The Mongoose model class. Required.

```ts
model: {
  type: User,
}
```

Crudify uses `model.type.name` as the model name and stores it as metadata on the controller prototype. This metadata is also used by the audit interceptor to resolve the model when capturing `oldDocument`.

### `model.cdto`

The DTO class used for create operations (`POST /`) and bulk create (`POST /bulk`).

```ts
model: {
  type: User,
  cdto: CreateUserDto,
}
```

The generated create routes use:

```ts
new ValidationPipe({ transform: true })
```

and Swagger uses `cdto` as the request body type. If omitted, `model.type` is used.

### `model.udto`

The DTO class used for update (`PATCH /:id`), bulk update (`PATCH /bulk`) and replace (`PUT /:id`) operations.

```ts
model: {
  type: User,
  udto: UpdateUserDto,
}
```

If omitted, `model.type` is used.

### `model.schema`

The Mongoose schema used to generate Swagger filter examples for `GET /`.

```ts
model: {
  type: User,
  schema: UserSchema,
}
```

When a schema is present, Crudify reads `schema.paths` and adds Swagger query properties such as `name[eq]`, `age[gte]` and `_id[in]` for each field.

`model.schema` does not change how Mongoose stores documents. It is used for documentation.

## `softDelete`

```ts
@Crudify({
  model: { type: User },
  softDelete: true,
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

When `softDelete` is `true`:

- `DELETE /:id` sets `deletedAt` instead of deleting the document.
- `DELETE /:id/soft` always sets `deletedAt`.
- `DELETE /:id/restore` removes `deletedAt`.
- `PATCH /bulk/restore` restores many documents.
- `DELETE /bulk` uses `softDeleteBulk` instead of `deleteBulk`.
- `findAll`, `findOne` and `count` do not automatically filter deleted documents. Add a `deletedAt` filter or override the service.

Soft delete operations are implemented with Mongoose `$set` and `$unset`:

```ts
{ $set: { deletedAt: new Date() } }
{ $unset: { deletedAt: 1 } }
```

They use `{ strict: false }` so `deletedAt` does not have to be declared in the schema.

## `routes`

### `routes.exclude`

Excludes generated routes. Excluded routes are hidden from Swagger and blocked with `403 Forbidden`.

```ts
routes: {
  exclude: ["deleteBulk", "restoreBulk"],
}
```

`routes.exclude` is applied when the decorator runs. The route still exists in the controller, but `DisableRouteGuard` denies access and `ApiExcludeEndpoint()` hides it from Swagger.

### `routes.disableBulk`

Disables every bulk route:

- `createBulk`
- `updateBulk`
- `deleteBulk`
- `restoreBulk`

```ts
routes: {
  disableBulk: true,
}
```

Internally, these routes are added to `routes.exclude`.

### `routes.config`

Per-route configuration:

```ts
routes: {
  config: {
    create: {
      decorators: [UseGuards(AuthGuard)],
    },
    update: {
      disabled: true,
    },
  },
}
```

| Property     | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `decorators` | Additional method decorators applied only to this route.                    |
| `disabled`   | Hides the route from Swagger and blocks it with `403 Forbidden`.            |

When a route is disabled, Crudify applies:

```ts
[ApiExcludeEndpoint(), UseGuards(DisableRouteGuard)]
```

and does not apply the built-in route decorators or user decorators.

### `routes.decorators`

Decorators applied to every enabled route:

```ts
routes: {
  decorators: [UseGuards(AuthGuard), ApiBearerAuth()],
}
```

Order of decorators for enabled routes:

1. Built-in Crudify decorators (HTTP method, Swagger, validation).
2. `routes.decorators`.
3. `routes.config[route].decorators`.

For excluded or disabled routes, only `ApiExcludeEndpoint()` and `DisableRouteGuard` are applied.

## Route-specific decorator example

```ts
import { UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

@Crudify({
  model: {
    type: User,
  },
  routes: {
    decorators: [ApiBearerAuth()],
    config: {
      create: {
        decorators: [UseGuards(AdminGuard)],
      },
      delete: {
        disabled: true,
      },
    },
  },
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

## Excluding a route vs disabling it at runtime

Crudify has two independent mechanisms:

| Mechanism                                | Configured in             | Result                                             |
| ---------------------------------------- | ------------------------- | -------------------------------------------------- |
| `routes.exclude` / `routes.config.disabled` | `@Crudify()` at build time | Route is hidden from Swagger and returns `403`.    |
| `Config` collection (`enabled`, `routes`) | MongoDB at runtime         | Controller returns a JSON body with `status: 403`. |

The runtime configuration route returns an object instead of throwing an exception. Its HTTP status is typically `200` and the body contains:

```json
{
  "success": false,
  "status": 403,
  "message": "The route 'delete' for model 'User' is currently disabled."
}
```

See [Runtime configuration](config.md) for details.

## Overriding generated methods

You can override CRUD methods in the service or controller.

### Override in the service

```ts
@Injectable()
export class UserService extends CrudifyService<User> {
  constructor(@InjectModel(User.name) model: Model<User>) {
    super(model);
  }

  async findAll(query: any) {
    const result = await super.findAll(query);
    return {
      ...result,
      results: result.results.filter((user) => user.active),
    };
  }
}
```

### Override in the controller

```ts
@Crudify({
  model: { type: User },
})
@Controller("users")
export class UserController extends CrudifyController<User> {
  constructor(public readonly service: UserService) {
    super(service);
  }

  async findAll(query: any) {
    const result = await this.service.findAll(query);
    return {
      ...result,
      results: result.results.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
}
```

`@Crudify` still applies the generated HTTP method, path, parameter decorators and Swagger metadata to overridden methods. You can add extra decorators directly on the override; they are preserved.

### Override with a different signature

If you change the method signature, keep the generated parameter indexes in mind. For example, `update` receives the route `id` at index `0` and the body at index `1`.

## How metadata is used

`@Crudify` stores metadata on the controller prototype:

| Key         | Value                           |
| ----------- | ------------------------------- |
| `model`     | The `model` object from options |
| `modelName` | `model.type.name`               |
| `softDelete`| The normalized soft delete flag |

The audit interceptor reads `modelName` to load `oldDocument` for update and delete requests.

## Related documentation

- [Routes](routes.md)
- [Runtime configuration](config.md)
- [Audit logging](audit.md)
- [Query parser](query-parser.md)
- [API reference](api-reference.md)
