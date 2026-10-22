# Crudify documentation

This directory contains the complete reference for `ncrudify` 1.5.0.

## Start here

1. [Getting started](getting-started.md) — install Crudify and build a first CRUD API.
2. [Routes](routes.md) — learn every generated endpoint and its request/response format.
3. [Crudify decorator](crudify-decorator.md) — configure models, DTOs, soft delete, bulk routes and decorators.

## Feature guides

| Guide                                      | Description                                                       |
| ------------------------------------------ | ----------------------------------------------------------------- |
| [Query parser](query-parser.md)            | Filters, operators, sorting, pagination, population and safety.    |
| [Runtime configuration](config.md)         | Enable or disable models and routes without redeploying.           |
| [Audit logging](audit.md)                  | Persistent audit records, exclusions and read endpoints.           |
| [Swagger](swagger.md)                      | OpenAPI setup, tags, authentication and generated operations.      |
| [Exceptions](exceptions.md)                | Error mapping and consistent error responses.                     |
| [Health](health.md)                        | Health endpoint and MongoDB connection states.                    |
| [API reference](api-reference.md)          | Exported classes, decorators, interfaces and method signatures.    |
| [Troubleshooting](troubleshooting.md)      | Common errors, edge cases and solutions.                           |
| [Migration to 1.5.0](migration-1.5.0.md)   | Upgrade notes for the audit release.                               |

## Version

The documentation targets **Crudify 1.5.0**.

## Conventions

- Examples use Express and the NestJS default HTTP adapter.
- `users` is used as the example controller path.
- `User` is the example Mongoose model.
- All paths assume no global prefix. If your application uses `app.setGlobalPrefix("api")`, prepend `/api` to every path.
- Audit examples assume that authentication has already populated `request.user`.
