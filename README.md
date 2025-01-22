# Crudify

**Are you a Mongoose lover but tired of writing the same CRUD code over and over again?**
Let Crudify do the heavy lifting for you! With this simple yet powerful NestJS library, you can instantly generate RESTful CRUD endpoints for your Mongoose models with just a few lines of code. Spend less time on boilerplate and more time building your application!

## 🚀 Why Crudify?

- **Tired of repetitive code?** Crudify automatically generates the full set of CRUD operations for your Mongoose models. No more writing the same functions every time you need a new endpoint.
- **Swagger documentation out of the box!** Crudify automatically generates a fully functional Swagger UI for your CRUD endpoints, making it easier for you and your team to test and document the API.
- **Highly customizable?** Of course! You can extend and tweak the generated endpoints to meet your specific needs.
- **Error handling made easy:** With an integrated logger, Crudify intercepts uncaught errors and makes debugging a breeze.
- **Designed for NestJS:** Seamlessly integrates with your NestJS project, no friction, no fuss.

## Installation

Ready to get started? Just install **Crudify** and let it work its magic:

```bash
npm install ncrudify
```

## 🙌 Features

- **No more boilerplate:** Generate Create, Read, Update, and Delete operations automatically.
- **Swagger docs created for you:** Just like that, Swagger UI will be set up automatically to interact with your API, making testing and documentation seamless.
- **Custom error handling:** Built-in error handling with easy logging configuration.
- **Flexible:** Customize the generated code or add your business logic.
- **NestJS integration:** Perfectly fits into your existing NestJS projects.

## Endpoints Automatically Created

Once you set it up, Crudify will handle these endpoints for you:

- `POST /your-model:` Create a new record
- `POST /your-model/bulk:` Create multiple new records
- `GET /your-model:` Retrieve all records
- `GET /your-model/:id:` Retrieve a specific record by ID
- `PATCH /your-model/:id:` Update a record by ID
- `PATCH /your-model/bulk` Update multiple records with filter in body
- `PUT /your-model/:id:` Replace a record by ID
- `DELETE /your-model/:id:` Delete a record by ID
- `DELETE /your-model/bulk` Delete multiple records

## 💥 Get Started Now

If you’re done wasting time with repetitive CRUD code and ready to level up your NestJS game, Crudify is here for you. Let’s get started! 🚀

## Configuring MongoDB with NestJS

If you haven't already configured MongoDB in your NestJS project, follow these steps:

- **Install Mongoose:**  
  First, you need to install the `@nestjs/mongoose` package and `mongoose` to connect to your MongoDB database:

```bash
npm install @nestjs/mongoose mongoose
```

- **Configure MongoDB in your NestJS module:**
  In your main application module (usually `app.module.ts`), import and configure the `MongooseModule` to connect to your MongoDB instance:

```javascript
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGODB_URI), UserModule],
})
export class AppModule {}
```

## Settup Swagger with Crudify

`Crudify` makes it easy to generate Swagger documentation automatically for your API. Just a few steps and you're good to go!

- **Import CrudifySwaggerModule in your AppModule:**
  In your `app.module.ts`, import `CrudifySwaggerModule` from `ncrudify`:

```javascript
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { CrudifySwaggerModule } from "ncrudify";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UserModule,
    CrudifySwaggerModule, // Import this module
  ],
})
export class AppModule {}
```

- **Set up Swagger in your main.ts:**
  Finally, configure Swagger in your `main.ts` by using `CrudifySwaggerModule.setupSwagger()`:

```javascript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CrudifySwaggerModule } from "ncrudify";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup Swagger
  CrudifySwaggerModule.setupSwagger(app);

  await app.listen(3000);
}
bootstrap();
```

This will automatically set up Swagger and generate a UI where you can interact with your API endpoints.

## Setup Crudify Logger
`Crudify` uses [errsole](https://www.errsole.com/) logger that captures uncaught errors and logs them. This logger is designed to make your debugging process smoother and more efficient. By using `CrudifyLoggerModule`, you can quickly track any issues that arise in your application.
- Import `CrudifyLoggerModule` in your `AppModule`:
First, you need to import `CrudifyLoggerModule` in your `app.module.ts` to enable logging for the application:
```javascript
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { CrudifySwaggerModule } from "ncrudify";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UserModule,
    CrudifySwaggerModule, 
    CrudifyLoggerModule.forRoot({
      uri: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_LOGDB,
    }), // Import this module
  ],
})
export class AppModule {}
```

This will set up the Crudify Logger to listen on port 3001 by default. The logger will catch any uncaught errors in your application and log them in a clear and organized way for you to review.

You can also adjust the logger’s configuration, such as the log level, to suit your project’s needs.

## Setup Crudify

### Example

- **Define your Mongoose model:**
  In this example, we define a `User` model using `@nestjs/mongoose` decorators and `@nestjs/swagger` for automatic API documentation.

```javascript
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import { Document, model, Model } from "mongoose";

@Schema({ timestamps: true })
export class User extends Document {
  @ApiProperty({ example: "John Doe", description: "The name of the user" })
  @Prop({ required: true })
  name: string;

  @ApiProperty({
    example: "test@gmail.com",
    description: "The email of the user",
  })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ example: 1, description: "The age of the user" })
  @Prop({ required: false })
  age: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModel: Model<User> = model < User > ("User", UserSchema);
```

- **Create your service:**
  Extend `CrudifyService` to benefit from the automatically generated CRUD methods. Override any methods if needed for custom logic, such as the `findAll` method in this example.

```javascript
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CrudifyService } from 'ncrudify';

@Injectable()
export class UserService extends CrudifyService<User> {
  constructor(@InjectModel(User.name) protected userModel: Model<User>) {
    super(userModel);
  }

  // override default method
  async findAll(query: FilterQuery<any> = {}): Promise<any> {
    const results = await this.userModel.find().exec();
    return results;
  }
}
```

- **Create your controller:**
  Use the `@Crudify` decorator to automatically generate CRUD routes for the `User` model. You can still override specific methods like `findAll` as shown below.

```javascript
import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Crudify, CrudifyController } from 'ncrudify';

@Crudify({
  model: {
    type: User,
  },
  routes: {
    exclued: ['updateBulk'] // this route will not be generated
  }
})
@Controller('users')
export class UserController extends CrudifyController<User> {
  constructor(public service: UserService) {
    super(service);
  }

  // override default method
  @Get()
  findAll() {
    return this.service.findAll();
  }
}
```

- **Create your module:**
  Set up the module to import `MongooseModule` and register the `User` schema, while also providing the service and controller.

```javascript
import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "./entities/user.entity";

@Module({
  imports: [MongooseModule.forFeature([{ name: "User", schema: UserSchema }])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```
# Custom Decorators

In Crudify, you can add custom decorators to individual routes or apply a decorator to all routes in your controller.

### Adding Custom Decorators
To add custom decorators to specific routes, you can define them in the config object for each route. 
 - You can also apply decorators globally to all routes at once, rather than specifying them for each individual route. This is useful when you want to apply the same logic (like guards or documentation) across multiple endpoints in your controller.
Here's an example:
```javascript 
@Crudify({
  model: {
    type: User, // Define your model
  },
  routes: {
    config: {
      // Custom decorators for the 'findAll' route
      findAll: {
        decorators: [
          ApiOperation({
            summary: 'Retrieve all users',
            description: 'This endpoint fetches all users from the database.',
          }), 
        ],
        disabled: false, // Optional: Specify whether this route is enabled or disabled
      },
      // Custom decorators for the 'create' route
      create: {
        decorators: [
          ApiOperation({
            summary: 'Create a new user',
            description: 'Use this endpoint to create a new user.',
          }), 
        ],
      },
    },
    decorators: [
      UseGuards(LoggingGuard), // Apply a guard to all routes
      ApiOperation({
        summary: 'Global Operation Summary',
        description: 'This is a global description that will apply to all routes.',
      }), // Global Swagger documentation
    ],
  },
})
class UserController {
  // Your controller methods
}
```

### Explanation
- **Global Decorators:** The decorators array inside the routes object will apply to all routes in the controller. For example, in the above example, UseGuards(LoggingGuard) and the global ApiOperation decorator are applied to every route in the controller.

- **Route-Specific Decorators:** You can still apply specific decorators to individual routes via the config object. These will be combined with the global decorators.
---
# Authorization
For managing route access control, you can use authorization decorators such as `UseGuards` or create your own custom decorators. These decorators help ensure that only authorized users can access specific routes.

## Using `UseGuards` for Authorization
`UseGuards` is a built-in NestJS decorator that allows you to specify guards that control access to your routes. Guards implement the `CanActivate` interface and determine if a request is authorized.

You can use `UseGuards` in combination with Crudify to protect your routes with custom authorization logic.

```javascript
@Crudify({
  model: {
    type: User, 
  },
  routes: {
    config: {
      create: {
        decorators: [
          UseGuards(AuthGuard), // Protect 'create' route with an authorization guard
        ],
      },
    },
  },
})
class UserController {
  // Your controller methods
}
```

## Explanation
- **Using `UseGuards`**: In the example above, `UseGuards(DisableRouteGuard)` is used to protect the `findAll` route. You can replace `DisableRouteGuard` with any custom guard that contains your authorization logic.
- **Custom Authorization Guards:** Guards can be custom-built to implement complex authorization rules (e.g., checking user roles or permissions).

### Creating a Custom Authorization Guard
```javascript 
import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // Authorization logic: check if user has 'admin' role
    return request.user && request.user.role === 'admin';
  }
}

```

--- 
# Query Parser Documentation

A flexible query parser that transforms URL query parameters into MongoDB queries. It supports filtering, sorting, pagination, field population, and complex logical operations.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Filter Operators](#filter-operators)
- [Logical Operators](#logical-operators)
- [Sorting](#sorting)
- [Pagination](#pagination)
- [Population](#population)
- [Complete Examples](#complete-examples)

## Basic Usage

The parser converts URL query parameters into a MongoDB-compatible query object with the following structure:

```typescript
{
  filters: Record<string, any>;   // MongoDB query conditions
  populate: any[];               // Population configurations
  sort: Record<string, 1 | -1>; // Sort configurations
  skip: number;                 // Number of documents to skip
  limit: number;                // Maximum number of documents to return
}
```

## Filter Operators

The parser supports the following filter operators:

| Operator | Description                    | MongoDB Equivalent | Example                          |
| -------- | ------------------------------ | ------------------ | -------------------------------- |
| eq       | Equals                         | $eq                | `name[eq]=John`                  |
| ne       | Not equals                     | $ne                | `age[ne]=25`                     |
| gt       | Greater than                   | $gt                | `age[gt]=18`                     |
| gte      | Greater than or equals         | $gte               | `age[gte]=18`                    |
| lt       | Less than                      | $lt                | `price[lt]=100`                  |
| lte      | Less than or equals            | $lte               | `price[lte]=100`                 |
| starts   | Starts with (case insensitive) | $regex             | `email[starts]=john`             |
| ends     | Ends with (case insensitive)   | $regex             | `email[ends]=gmail.com`          |
| cont     | Contains (case insensitive)    | $regex             | `name[cont]=oh`                  |
| excl     | Excludes (case insensitive)    | $not               | `name[excl]=test`                |
| in       | In array                       | $in                | `status[in]=active,pending`      |
| notin    | Not in array                   | $nin               | `status[notin]=deleted,archived` |
| isnull   | Field is null/undefined        | $exists: false     | `deletedAt[isnull]=true`         |
| notnull  | Field is not null/undefined    | $exists: true      | `email[notnull]=true`            |
| between  | Value is between (inclusive)   | $gte, $lte         | `age[between]=18,25`             |

### Examples

```
# Find users aged 18 or older
/users?age[gte]=18

# Find users with gmail addresses
/users?email[ends]=gmail.com

# Find users with specific statuses
/users?status[in]=active,pending

# Find users aged between 18 and 25
/users?age[between]=18,25
```

## Logical Operators

You can combine multiple conditions on the same field using logical operators (AND/OR).

### Syntax
Add `_op=and` or `_op=or` to specify the logical operator for a field's conditions.

- Default behavior (without _op) is OR
- Use `fieldname_op=and` for AND operations
- Use `fieldname_op=or` for OR operations (explicit)

### Examples

```
# Emails that start with 'john' AND end with 'gmail.com'
/users?email[starts]=john&email[ends]=gmail.com

# Emails that start with 'john' OR end with 'gmail.com'
/users?email[starts]=john&email[ends]=gmail.com&email_op=or

# Mix AND/OR operations on different fields
/users?email[starts]=john&email[ends]=gmail.com&email_op=and&status[in]=active,pending&status_op=or
```

## Sorting

Sort results by one or more fields.

### Syntax
- Use `sort=field` for ascending order
- Use `sort=-field` for descending order
- Combine multiple fields with commas

### Examples

```
# Sort by name ascending
/users?sort=name

# Sort by created date descending
/users?sort=-createdAt

# Sort by status ascending, then created date descending
/users?sort=status,-createdAt
```

## Pagination

Control the number of results and their offset.

### Parameters
- `skip`: Number of documents to skip
- `limit`: Maximum number of documents to return

### Examples

```
# Get the first 10 results
/users?limit=10

# Get 10 results, starting from the 20th document
/users?skip=20&limit=10
```

## Population

Populate references to other collections with various options for controlling the populated data.

### Basic Population

```
# Populate a single reference
/users?populate=posts

# Populate multiple references
/users?populate=posts,comments

# Populate nested references
/users?populate=posts.author,posts.comments
```

### Advanced Population Options

#### Select Specific Fields
Choose which fields to include in populated documents:
```
/users?populate.posts.select=title,content,author
```

#### Filter Populated Documents
Apply filters to populated documents:
```
/users?populate.posts.status[eq]=published
```

#### Sort Populated Documents
Sort populated documents:
```
/users?populate.posts.sort=-createdAt
```

#### Combine Population Options
```
/users?populate.posts.select=title,content&populate.posts.status[eq]=published&populate.posts.sort=-createdAt
```

## Complete Examples

Here are some complete examples combining multiple features:

### Example 1: Complex User Query
```
/users?
  name[starts]=john&
  email[ends]=gmail.com&
  email_op=and&
  age[between]=25,35&
  status[in]=active,premium&
  sort=-createdAt&
  limit=10&
  populate=posts,comments
```

This query will:
- Find users whose name starts with "john"
- AND whose email ends with "gmail.com"
- AND whose age is between 25 and 35
- AND whose status is either active or premium
- Sort results by creation date (newest first)
- Limit to 10 results
- Populate posts and comments

### Example 2: Advanced Post Query with Population
```
/posts?
  title[cont]=javascript&
  status[eq]=published&
  tags[in]=tutorial,nodejs&
  populate.author.select=name,email&
  populate.comments.status[eq]=approved&
  populate.comments.sort=-createdAt&
  sort=-views,title&
  skip=20&
  limit=10
```

This query will:
- Find posts containing "javascript" in the title
- That are published
- Tagged with either "tutorial" or "nodejs"
- Populate author (only name and email)
- Populate approved comments (sorted by creation date)
- Sort results by views (descending) and title (ascending)
- Skip first 20 results
- Limit to 10 results

## Contributing

We love contributions! Whether you’ve spotted a bug or have an awesome idea, feel free to open an issue or submit a PR.

## Support
 If you like my work and want to support give a ⭐ to the repo.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/mitinoh) 

Thank you so much ❤️.

## License

See the LICENSE file for more details.
