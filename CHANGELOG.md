# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-11-07

### Added
- **Dynamic route configuration system:**  
  Introduced a new `ConfigService` and `ConfigController` to dynamically enable or disable routes per model.  
  - Routes can be toggled at runtime without redeploying the application.  
  - Configuration is cached in memory for fast access and automatically loaded at startup.  

- **Automatic route control:**  
  The `CrudifyController` now checks route availability using `ConfigService.isRouteEnabled(model, route)` before executing a CRUD operation.

- **Soft route blocking (no exception):**  
  Instead of throwing an exception, disabled endpoints now return a structured JSON message:
  ```json
  {
    "success": false,
    "status": 403,
    "message": "The route 'findAll' for model 'User' is currently disabled."
  }
  ```
  This improves frontend handling and avoids unnecessary server errors.

- **Interceptor support:**
  Added an optional RouteAvailabilityInterceptor to centralize route availability checks for all controllers.
  
## [1.3.1] - 2025-10-30

### Fix
- **Fixed a bug that always disabled softDelete** 
  

## [1.3.0] - 2025-10-28
### Added
- **New `/count` route:** Added an endpoint to count the number of records matching the query filters.  
  Example: `GET /your-model/count`
- **New `/:id/soft` route:** Added soft delete support for single records via `DELETE /your-model/:id/soft`.

### Updated
- **NestJS updated to the latest version** for improved stability and compatibility.
- **Dependencies updated** to their latest compatible versions, ensuring better performance and security.


---
## [1.2.6] - 2025-02-10 
### Removed
- **CrudifyLoggerModule:** Insted use `CrudifyModule`

---
## [1.2.5] - 2025-01-30
### Fix
- **QueryParser:** Fixed an issue with `in` operator.

---
## [1.2.4] - 2025-01-30
### Added
- **CrudifyController & CrudifyService:** Added support for `CreateDto` and `UpdateDto` to handle creation and update operations more effectively.
- **Soft Delete:** Implemented soft delete functionality, with routes for both single and bulk deletion.
- **DisableBulk:** Added `disableBulk` in routes.disableBulk to control bulk operations more granularly.

### Fix
- **OpenApi:** Fixed an issue with `OpenApi` types generation, ensuring that each route now has a unique operationId to prevent route duplication and improve Swagger documentation clarity.
- **ErrsoleConf:** Resolved an issue with the default URI configuration, ensuring it now defaults correctly.

---
## [1.2.1] - 2025-01-28
### Added
- **Example filter:** Added example filters in swaggerUI
- **CrudifyLoggerModule:** Now supports all errsole options.

### Fix
- **Validation pipe:** `UsePipes(new ValidationPipe({ transform: true }))` as default.

### Removed
- **CrudifySwaggerModule:** Insted use classic configuration of swagger.

---

## [1.2.0] - 2025-01-22
### Added
- **Custom Decorators:** Introduced support for custom decorators:
  - **Route-Specific Decorators:** Define custom decorators for specific routes to enhance flexibility and control.
  - **Generic Decorators:** Apply generic decorators across all routes for consistent functionality.

### Fixed
- **Filters Bug:** Resolved issues with filters that caused unexpected behavior in certain scenarios.
- **Console Logging:** Logs are now properly printed to the console in addition to being stored in the database, improving debugging and monitoring capabilities.

---

## [1.1.1] - 2025-01-20
### Bug
- **MongoDB URI Configuration:** Resolved an issue where the MongoDB URI was not being recognized properly when configuring the `CrudifyLoggerModule`. The default URI `mongodb://127.0.0.1:27017` with `logs` as the database is now used correctly.
  - You can now configure the module using `CrudifyLoggerModule.forRoot()` with a custom URI and database name:
    ```typescript
    CrudifyLoggerModule.forRoot({
      uri: 'mongodb://xxx.xxx.xxx.xxx:yyyyy/',
      dbName: 'mydblogger',
    });
    ```

---

## [1.1.0] - 2025-01-17
### Added
- **Route Exclusion:** Added the ability to exclude specific routes from CRUD generation via the `routes.exclude` option in the `@Crudify` decorator.
- **Bulk Operations:** Introduced new bulk routes for batch processing:
  - `POST /your-model/bulk`: Create multiple records in a single request.
  - `PATCH /your-model/bulk`: Update multiple records based on specified filters or IDs.
  - `DELETE /your-model/bulk`: Delete multiple records at once using filters or a list of IDs.

---

## [1.0.0] - 2025-01-10
### Added
- **Core Functionality:** Initial release of the library with automatic CRUD generation for Mongoose models in NestJS.
  - `POST /your-model`: Create a new record.
  - `GET /your-model`: Retrieve all records.
  - `GET /your-model/:id`: Retrieve a record by ID.
  - `PATCH /your-model/:id`: Update specific fields of a record by ID.
  - `PUT /your-model/:id`: Replace an entire record by ID.
  - `DELETE /your-model/:id`: Delete a record by ID.
- **Swagger Integration:** Automatically generate Swagger documentation for all CRUD routes.
- **Filter Support:** Enable filtering of query results using operators like `$eq`, `$gt`, `$cont`, and more.
- **Customizable Services:** Allow developers to extend and override CRUD service methods for custom logic.
- **Built-in Error Handling:** Integrated a logger to handle uncaught errors and log them for debugging.

---

> **Note:** For any issues or feature requests, please open a ticket in the [GitHub repository](https://github.com/mitinoh/crudify).

