# Getting started

This guide creates a complete CRUD API for a `User` model using NestJS, Mongoose and Crudify.

## 1. Requirements

- Node.js `>=20.19.0`
- NestJS `12.x`
- `@nestjs/mongoose` `12.x`
- `@nestjs/swagger` `12.x`
- Mongoose `9.x`
- A running MongoDB instance

## 2. Install

```bash
npm install ncrudify @nestjs/mongoose mongoose @nestjs/swagger
```

If your NestJS setup does not already include Swagger UI, install:

```bash
npm install swagger-ui-express
```

## 3. Configure the application module

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

`CrudifyModule.forRoot()` enables:

- The generated CRUD infrastructure.
- The runtime configuration controller (`/config`).
- The health controller (`/health`).
- The audit module. Automatic audit logging remains disabled until `audit.enabled` is set to `true`.

### Module options

```ts
export interface ICrudifyModuleOptions {
  uri?: string;
  audit?: boolean | IAuditOptions;
}
```

| Option  | Description                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------- |
| `uri`   | Accepted for backward compatibility and currently ignored. Configure MongoDB with `MongooseModule.forRoot()`. |
| `audit` | `true`, `false`, or an object with audit options. Automatic logging is disabled by default.     |

## 4. Enable extended query parsing

Crudify filters use bracket notation:

```
GET /users?age[gte]=18&status[in]=active,pending
```

With Express, enable the extended parser in `main.ts`:

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

Without this line, Express may not parse nested filters or repeated query parameters correctly.

## 5. Define the model

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

  @ApiProperty({ example: true, required: false })
  @Prop({ default: true })
  active?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

## 6. Create DTOs (optional but recommended)

Crudify accepts DTOs through `model.cdto` and `model.udto`. They are used by Swagger and by the automatic `ValidationPipe`.

```ts
// user/dto/create-user.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;
}
```

```ts
// user/dto/update-user.dto.ts
import { PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

If `cdto` or `udto` is omitted, Crudify uses the model class itself for validation and Swagger.

## 7. Create the service

```ts
// user/user.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CrudifyService } from "ncrudify";
import { User } from "./entities/user.entity";

@Injectable()
export class UserService extends CrudifyService<User> {
  constructor(
    @InjectModel(User.name) protected readonly userModel: Model<User>
  ) {
    super(userModel);
  }
}
```

`CrudifyService` provides `create`, `createBulk`, `findAll`, `findOne`, `count`, `update`, `updateBulk`, `put`, `delete`, `deleteBulk`, `softDelete`, `softDeleteBulk`, `restore` and `restoreBulk`.

## 8. Create the controller

```ts
// user/user.controller.ts
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Crudify, CrudifyController } from "ncrudify";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, UserSchema } from "./entities/user.entity";
import { UserService } from "./user.service";

@ApiTags("users")
@Crudify({
  model: {
    type: User,
    cdto: CreateUserDto,
    udto: UpdateUserDto,
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

The `@Crudify` decorator generates the route handlers and applies NestJS and Swagger decorators to the methods inherited from `CrudifyController`.

## 9. Register the feature module

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

## 10. Run the application

```bash
npm run start:dev
```

You now have:

```
POST   /users
POST   /users/bulk
GET    /users
GET    /users/count
GET    /users/:id
PATCH  /users/:id
PATCH  /users/bulk
PUT    /users/:id
DELETE /users/:id
DELETE /users/:id/soft
DELETE /users/:id/restore
DELETE /users/bulk
PATCH  /users/bulk/restore
```

## 11. Test the API

Create a user:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

List users with filters:

```bash
curl "http://localhost:3000/users?age[gte]=18&sort=-createdAt&limit=10"
```

Find one user:

```bash
curl http://localhost:3000/users/6a6b3a0753210eef9724d6c7
```

Update a user:

```bash
curl -X PATCH http://localhost:3000/users/6a6b3a0753210eef9724d6c7 \
  -H "Content-Type: application/json" \
  -d '{"age":31}'
```

## Recommended project structure

```text
src/
  app.module.ts
  main.ts
  user/
    dto/
      create-user.dto.ts
      update-user.dto.ts
    entities/
      user.entity.ts
    user.controller.ts
    user.module.ts
    user.service.ts
```

## Next steps

- [Configure generated routes](crudify-decorator.md)
- [Learn the endpoint contract](routes.md)
- [Master filtering and query parameters](query-parser.md)
- [Enable runtime configuration](config.md)
- [Enable audit logging](audit.md)
- [Configure Swagger](swagger.md)
