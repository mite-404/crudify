# Crudify

![npm](https://img.shields.io/npm/v/ncrudify?color=blue&label=npm&logo=npm) ![NestJS](https://img.shields.io/badge/NestJS-%23E0234E?logo=nestjs&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-%2347A248?logo=mongodb&logoColor=white) ![GitHub last commit](https://img.shields.io/github/last-commit/mitinoh/nest-crudify) ![GitHub issues](https://img.shields.io/github/issues/mitinoh/nest-crudify) ![GitHub stars](https://img.shields.io/github/stars/mitinoh/nest-crudify?style=social)

**Crudify** is a configurable CRUD generator for **NestJS** and **Mongoose**. It creates a complete set of REST endpoints for a Mongoose model, generates Swagger documentation, supports runtime route enable/disable, soft deletes, bulk operations, advanced query parsing and optional MongoDB-backed audit logging.

You write the model, service and controller. Crudify generates the routes and the repetitive CRUD logic.

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Generated endpoints](#generated-endpoints)
- [Core concepts](#core-concepts)
- [Runtime configuration](#runtime-configuration)
- [Audit logging](#audit-logging)
- [Query language](#query-language)
- [Soft delete](#soft-delete)
- [Overriding generated behavior](#overriding-generated-behavior)
- [Swagger](#swagger)
- [Error handling](#error-handling)
- [Health check](#health-check)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Requirements

| Requirement        | Version    |
| ------------------ | ---------- |
| Node.js            | `>=20.19.0` |
| NestJS             | `12.x`      |
| `@nestjs/mongoose` | `12.x`      |
| `@nestjs/swagger`  | `12.x`      |
| Mongoose           | `9.x`       |
| TypeScript         | `>=5.x`     |

## Installation

```bash
npm install ncrudify @nestjs/mongoose mongoose @nestjs/swagger
```

Depending on your NestJS and Express setup, you may also need the Swagger UI package:

```bash
npm install swagger-ui-express
```

## Quick start

### 1. Configure MongoDB and Crudify

```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CrudifyModule } from "ncrudify";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    CrudifyModule.forRoot(),
    UserModule,
  ],
})
export class AppModule {}
```

`CrudifyModule.forRoot()` registers the runtime configuration module, the health endpoint and the optional audit module.

### 2. Enable extended query parsing

Crudify uses bracket-style query parameters such as `age[gte]=18`. With Express, enable the extended query parser in `main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.set("query parser", "extended");
  await app.listen(3000);
}

bootstrap();
```

Without this setting, nested filters and arrays may not be parsed correctly.

### 3. Define a Mongoose model

```ts
// user/entities/user.entity.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ example: "John Doe" })
  @Prop({ required: true })
  name!: string;

  @ApiProperty({ example: "john@example.com" })
  @Prop({ required: true, unique: true })
  email!: string;

  @ApiProperty({ example: 30, required: false })
  @Prop()
  age?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

### 4. Create the service

```ts
// user/user.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CrudifyService } from "ncrudify";
import { User } from "./entities/user.entity";

@Injectable()
export class UserService extends CrudifyService<User> {
  constructor(@InjectModel(User.name) protected readonly userModel: Model<User>) {
    super(userModel);
  }
}
```

### 5. Create the controller

```ts
// user/user.controller.ts
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Crudify, CrudifyController } from "ncrudify";
import { User, UserSchema } from "./entities/user.entity";
import { UserService } from "./user.service";

@ApiTags("users")
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

### 6. Register the feature module

```ts
// user/user.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./entities/user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

You now have a complete CRUD API under `/users`.

## Generated endpoints

| Method   | Path                         | Description                                      |
| -------- | ---------------------------- | ------------------------------------------------ |
| `POST`   | `/users`                     | Create one record                                |
| `POST`   | `/users/bulk`                | Create many records                              |
| `GET`    | `/users`                     | Find records with filters, sorting and paging    |
| `GET`    | `/users/count`               | Count records matching filters                   |
| `GET`    | `/users/:id`                 | Find one record by ID                            |
| `PATCH`  | `/users/:id`                 | Partially update one record                      |
| `PATCH`  | `/users/bulk`                | Update many records by filter                    |
| `PUT`    | `/users/:id`                 | Replace one record                               |
| `DELETE` | `/users/:id`                 | Delete one record (or soft delete when enabled)  |
| `DELETE` | `/users/:id/soft`            | Soft delete one record                           |
| `DELETE` | `/users/:id/restore`         | Restore one soft-deleted record                  |
| `DELETE` | `/users/bulk`                | Delete many records by filter                    |
| `PATCH`  | `/users/bulk/restore`        | Restore many soft-deleted records by filter      |

See [docs/routes.md](docs/routes.md) for request bodies, responses and curl examples.

## Core concepts

### `@Crudify` options

```ts
@Crudify({
  model: {
    type: User,
    cdto: CreateUserDto,
    udto: UpdateUserDto,
    schema: UserSchema,
  },
  softDelete: true,
  routes: {
    exclude: ["deleteBulk"],
    disableBulk: false,
    decorators: [UseGuards(AuthGuard)],
    config: {
      findAll: {
        decorators: [ApiBearerAuth()],
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

| Option              | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `model.type`        | Mongoose model class. Required.                                             |
| `model.cdto`        | DTO used for create requests. Defaults to the model class.                  |
| `model.udto`        | DTO used for update/replace requests. Defaults to the model class.          |
| `model.schema`      | Mongoose schema used for Swagger filter generation.                         |
| `softDelete`        | Makes `DELETE /:id` update `deletedAt` instead of removing the document.    |
| `routes.exclude`    | Routes that must not be publicly available. They are hidden from Swagger.   |
| `routes.disableBulk`| Disables all bulk routes.                                                   |
| `routes.decorators` | Decorators applied to every enabled route.                                  |
| `routes.config`     | Per-route decorators and disabled flag.                                     |

The complete reference is in [docs/crudify-decorator.md](docs/crudify-decorator.md).

### `CrudifyService`

Extend `CrudifyService<T>` to inherit all CRUD operations. Every method can be overridden:

```ts
async findAll(query: any) {
  const result = await super.findAll(query);
  return {
    ...result,
    results: result.results.filter((user) => user.active),
  };
}
```

The complete service API is in [docs/api-reference.md](docs/api-reference.md).

### `CrudifyController`

Extend `CrudifyController<T>` to inherit the generated route handlers. You can override any handler while keeping the generated route decorators.

```ts
@Get(":id")
findOne(@Param("id") id: string) {
  return this.service.findOne({ _id: id });
}
```

## Runtime configuration

Crudify can enable or disable a model or individual CRUD routes at runtime, without redeploying the application. Configuration is stored in MongoDB and cached in memory.

```ts
CrudifyModule.forRoot();
```

Available endpoints:

| Method | Path              | Description                                      |
| ------ | ----------------- | ------------------------------------------------ |
| `GET`  | `/config`         | Return the current configuration cache           |
| `PUT`  | `/config/:model`  | Update or create the configuration for a model   |
| `POST` | `/config/reload`  | Reload the configuration cache from MongoDB      |

Example:

```bash
curl -X PUT http://localhost:3000/config/User \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "routes": {
      "delete": false,
      "deleteBulk": false
    },
    "props": {
      "group": "admin"
    }
  }'
```

Setting `enabled: false` disables every route for that model. Per-route flags are evaluated only when the model is enabled. See [docs/config.md](docs/config.md).

## Audit logging

Audit logging is **opt-in**. It records HTTP requests in MongoDB and supports exclusions with `@NoAudit()`.

```ts
CrudifyModule.forRoot({
  audit: {
    enabled: true,
    collectionName: "audit_logs",
    userExtractor: (request) =>
      request.user?._id ?? request.user?.email ?? "anonymous",
  },
});
```

Every request stores:

```ts
interface AuditLogRecord {
  user: string;
  action: string;
  entityId: string | null;
  details: Record<string, any>;
  createdAt?: Date | string;
}
```

The `details` object contains `method`, `url`, `payload`, `oldDocument` (for `PATCH`, `PUT` and `DELETE` when the model can be resolved), `statusCode`, `durationMs` and, for failed requests, `error`.

Exclude routes:

```ts
import { NoAudit } from "ncrudify";

@NoAudit("GET/:id")
@Get(":id")
findOne() {
  // ...
}
```

Audit also exposes:

- `GET /audit` — read audit logs with filters, sorting and pagination.
- `GET /audit/:id` — read one audit log.
- `AuditService` — injectable service for manual logging.

See [docs/audit.md](docs/audit.md) for the complete reference.

## Query language

`GET /users` supports filtering, sorting, pagination and population through query parameters:

```
GET /users?age[gte]=18&status[in]=active,pending&sort=-createdAt&limit=10&skip=20
```

Supported operators include `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `starts`, `ends`, `cont`, `excl`, `in`, `notin`, `isnull`, `notnull` and `between`.

The complete query language is documented in [docs/query-parser.md](docs/query-parser.md).

## Soft delete

Enable soft delete per controller:

```ts
@Crudify({
  model: {
    type: User,
  },
  softDelete: true,
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

With soft delete enabled:

- `DELETE /users/:id` sets `deletedAt` instead of removing the document.
- `DELETE /users/:id/soft` always performs a soft delete.
- `DELETE /users/:id/restore` removes `deletedAt`.
- `PATCH /users/bulk/restore` restores many documents.
- `findAll` and `findOne` do **not** automatically exclude soft-deleted documents. Add `deletedAt` filters or override the service if you need automatic filtering.

## Overriding generated behavior

You can override service methods, controller methods, or both.

### Override a service method

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
      results: result.results.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
}
```

### Override a controller method

```ts
@Crudify({ model: { type: User } })
@Controller("users")
export class UserController extends CrudifyController<User> {
  constructor(public service: UserService) {
    super(service);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne({ _id: id });
  }
}
```

## Swagger

Crudify adds Swagger metadata to every generated route, including operation IDs, request bodies, response types and filter examples.

```ts
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const config = new DocumentBuilder()
  .setTitle("Crudify API")
  .setDescription("API generated with Crudify")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("docs", app, document, {
  swaggerOptions: { filter: true },
});
```

See [docs/swagger.md](docs/swagger.md) for tags, authentication, route-specific decorators and disabled-route behavior.

## Error handling

`CrudifyController` uses `CrudifyExceptionFilter`, which maps common errors to consistent HTTP responses:

| Error                         | Status | Response error          |
| ----------------------------- | ------ | ----------------------- |
| Mongoose `CastError`          | `400`  | `Bad Request`           |
| Mongoose `ValidationError`    | `400`  | `Bad Request`           |
| Duplicate key (`code: 11000`) | `409`  | `Conflict`              |
| `HttpException`               | own    | own                     |
| Unknown error                 | `500`  | `Internal Server Error` |

Response shape:

```json
{
  "statusCode": 400,
  "message": "Cast to ObjectId failed for value ...",
  "error": "Bad Request"
}
```

See [docs/exceptions.md](docs/exceptions.md).

## Health check

`GET /health` checks the application and MongoDB connection:

```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2026-10-22T10:00:00.000Z"
}
```

When MongoDB is not connected, the endpoint returns `503 Service Unavailable` with the same payload shape. See [docs/health.md](docs/health.md).

## Documentation

| Document                                                 | Contents                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)               | Installation, module setup and first CRUD API                 |
| [Crudify decorator](docs/crudify-decorator.md)           | All `@Crudify` options and route customization                |
| [Routes](docs/routes.md)                                 | Every generated endpoint with bodies, responses and examples  |
| [Query parser](docs/query-parser.md)                     | Filters, operators, sorting, pagination and population        |
| [Runtime configuration](docs/config.md)                  | Enable/disable models and routes at runtime                   |
| [Audit logging](docs/audit.md)                           | Audit records, exclusions, reading logs and manual logging    |
| [Swagger](docs/swagger.md)                               | Swagger setup, tags, auth and generated operations            |
| [Exceptions](docs/exceptions.md)                         | Error mapping and response format                             |
| [Health](docs/health.md)                                 | Health endpoint and connection states                         |
| [API reference](docs/api-reference.md)                   | Exported classes, decorators, interfaces and method signatures|
| [Migration to 1.5.0](docs/migration-1.5.0.md)            | Upgrade notes for the audit release                           |
| [Troubleshooting](docs/troubleshooting.md)               | Common problems and solutions                                 |

## Troubleshooting

- **Filters do not work**: enable `app.set("query parser", "extended")`.
- **`@Crudify` throws `requires options.model.type`**: pass the Mongoose model class in `model.type`.
- **Audit logs are not created**: verify `audit.enabled: true`, check that the request is not excluded by `@NoAudit`, and inspect the Nest logger for audit write errors.
- **`oldDocument` is missing**: it is available only for `PATCH`, `PUT` and `DELETE` requests with an `id` param on controllers decorated with `@Crudify`.
- **Soft-deleted records still appear**: `findAll` does not filter `deletedAt` automatically.

See [docs/troubleshooting.md](docs/troubleshooting.md) for more.

## Contributing

Contributions are welcome. Open an issue or submit a pull request on [GitHub](https://github.com/mitinoh/crudify).

Before opening a pull request:

```bash
npm test
npm run build
```

## License

MIT. See [LICENSE](LICENSE).
