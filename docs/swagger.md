# Swagger / OpenAPI

Crudify adds Swagger metadata to every generated route:

- Operation summaries.
- Unique operation IDs (`modelname_routeName`, where `modelname` is lowercased).
- Request body types from `model.cdto` and `model.udto`.
- Response types from `model.type`.
- Path parameters.
- Query parameter examples for filters.

This documentation assumes `@nestjs/swagger` is installed.

## Install

```bash
npm install @nestjs/swagger
```

Depending on your NestJS and Express setup, you may also need:

```bash
npm install swagger-ui-express
```

## Configure Swagger

```ts
// main.ts
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.set("query parser", "extended");
  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("Crudify API")
    .setDescription("API generated with Crudify")
    .setVersion("1.5.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      filter: true,
      persistAuthorization: true,
    },
  });

  await app.listen(3000);
}

bootstrap();
```

The UI is available at:

```
http://localhost:3000/docs
```

With `app.setGlobalPrefix("api")`, the routes are available under `/api`, while the Swagger UI remains at `/docs` unless it is also prefixed.

## Tags

Use `@ApiTags()` to group a controller:

```ts
import { ApiTags } from "@nestjs/swagger";

@ApiTags("users")
@Crudify({
  model: { type: User },
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

Tags make the Swagger UI easier to navigate and enable filtering when `swaggerOptions.filter` is `true`.

You can also configure global tags:

```ts
const config = new DocumentBuilder()
  .setTitle("Crudify API")
  .addTag("users", "User operations")
  .addTag("products", "Product operations")
  .build();
```

## Generated operation IDs

Crudify generates one operation ID per model and route:

```
user_create
user_createBulk
user_findAll
user_findOne
user_count
user_update
user_updateBulk
user_put
user_delete
user_deleteSoft
user_deleteBulk
user_restore
user_restoreBulk
```

The operation ID is based on the lowercased `model.type.name` and the internal route name. Different models therefore produce different operation IDs, even when their controller paths are different.

## Request and response schemas

### Create and bulk create

- Request body: `model.cdto` or `model.type`.
- Response: `model.type`.
- Bulk create uses an array of `model.cdto`.

### Update, bulk update and replace

- Request body: `model.udto` or `model.type`.
- Response: `model.type`.
- Bulk update uses an object with `filter` and `updateDto`.
- Bulk restore uses an object with `filter`.
- Bulk delete uses an object with `filter`.

### Find all

- Response: array of `model.type`.
- Query examples are generated from `model.schema` when provided.

### Find one, delete, soft delete and restore

- Path parameter: `id`.
- Response: `model.type`.
- `findOne` and delete operations document `404` responses, but the default service methods return `null` instead of throwing when a document is missing.

## Filters in Swagger

When you pass `model.schema`, Crudify reads the schema paths and adds query properties such as:

```
name[eq]
name[ne]
name[gt]
name[gte]
name[lt]
name[lte]
name[in]
```

for each schema field. It also documents:

- `limit`
- `skip`
- `sort`

Example schema:

```ts
@Crudify({
  model: {
    type: Product,
    schema: ProductSchema,
  },
})
@Controller("products")
export class ProductController extends CrudifyController<Product> {}
```

Without `model.schema`, the generic `filters` query parameter is still documented, but field-specific examples are not generated.

## Authentication

Add bearer authentication:

```ts
const config = new DocumentBuilder()
  .setTitle("Crudify API")
  .addBearerAuth()
  .build();
```

Apply it globally to generated routes:

```ts
import { ApiBearerAuth } from "@nestjs/swagger";
import { UseGuards } from "@nestjs/common";

@Crudify({
  model: { type: User },
  routes: {
    decorators: [ApiBearerAuth(), UseGuards(AuthGuard)],
  },
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

Or per route:

```ts
@Crudify({
  model: { type: User },
  routes: {
    config: {
      create: {
        decorators: [ApiBearerAuth(), UseGuards(AdminGuard)],
      },
      findAll: {
        decorators: [ApiBearerAuth()],
      },
    },
  },
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

## Disabled routes

Routes excluded with `routes.exclude` or disabled with `routes.config[route].disabled` receive `@ApiExcludeEndpoint()`. They do not appear in Swagger.

Runtime-disabled routes are still present in Swagger because runtime configuration can change while the application is running.

## Custom Swagger decorators

You can add any NestJS Swagger decorator through `routes.decorators` or `routes.config[route].decorators`:

```ts
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";

@Crudify({
  model: { type: User },
  routes: {
    config: {
      create: {
        decorators: [
          ApiOperation({ summary: "Create a user" }),
          ApiHeader({ name: "x-tenant-id", required: true }),
          ApiResponse({ status: 201, description: "User created" }),
        ],
      },
    },
  },
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

For decorators that need to apply to every route, use `routes.decorators`.

## Documenting the model

Add `@ApiProperty()` to model fields and DTOs:

```ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class User {
  @ApiProperty({ example: "John Doe" })
  name!: string;

  @ApiProperty({ example: "john@example.com" })
  email!: string;

  @ApiPropertyOptional({ example: 30 })
  age?: number;
}
```

This metadata is used by Swagger for generated request and response schemas.

## Swagger and audit

Swagger requests are normal HTTP requests. If audit logging is enabled, Swagger calls are audited like any other request. If you do not want to audit interactive Swagger usage, add an authentication check or exclude specific routes with `@NoAudit`.

## Related documentation

- [Crudify decorator](crudify-decorator.md)
- [Routes](routes.md)
- [API reference](api-reference.md)
