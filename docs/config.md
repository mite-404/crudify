# Config Module

The **Config Module** provides dynamic runtime control over which models and CRUD routes are enabled or disabled in the `Crudify` system. It stores configuration data in MongoDB, exposes REST endpoints to manage it, and maintains an in-memory cache for fast access.

---

## 📦 Overview

Each `Config` document represents the configuration for a single model. It defines:
- Whether the model is globally enabled.
- Which CRUD routes are individually enabled or disabled.
- Any additional metadata (`props`) you want to attach.

This allows administrators to dynamically enable/disable features without redeploying the application.

---

## 🧱 Entity: `Config`

```ts
@Schema({ timestamps: true })
export class Config extends Document {
  @Prop({ required: true, unique: true })
  modelName!: string; // The model this configuration applies to.
  @Prop({ type: Object })
  routes?: Partial<Record<ControllerMethods, boolean>>; // CRUD route flags
  @Prop({ default: true })
  enabled?: boolean; // Whether this model is globally active
  @Prop({ type: Object })
  props?: Partial<Record<string, any>>; // Additional metadata
}
```

### Example Document

```json
{
  "modelName": "User",
  "enabled": true,
  "routes": {
    "create": true,
    "update": false,
    "delete": true,
    "restore": true
  },
  "props": {
    "group": "admin"
  }
}
```

---

## ⚙️ ConfigService

The ConfigService is responsible for:
- Loading all configurations from MongoDB into an in-memory cache.
- Checking route availability at runtime.
- Updating configurations and reloading them dynamically.

### Public Methods

| Method                                                  | Description                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `load()`                                                | Loads all configurations from MongoDB and rebuilds the cache. |
| `getAll()`                                              | Returns the current configuration cache.                      |
| `isRouteEnabled(model: string, route: string)`          | Returns true if the given route is enabled for the model.     |
| `updateConfig(model: string, updates: Partial<Config>)` | Creates or updates a configuration for a specific model.      |
| `notEnabledResponse(modelName: string, route: string)`  | Returns a standard 403 response when a route is disabled.     |

### Example Usage

```ts
if (!this.configService.isRouteEnabled('User', 'delete')) {
  return this.configService.notEnabledResponse('User', 'delete');
}
```

---

## 🧭 ConfigController

Base route: `/config`

### GET `/config`

Returns the current configuration cache for all models.

#### Response Example

```json
{
  "User": {
    "enabled": true,
    "routes": {
      "create": true,
      "update": false,
      "delete": true
    },
    "props": {
      "group": "admin"
    }
  }
}
```

### PUT `/config/:model`

Updates or creates a configuration for the specified model. If the configuration does not exist, it will be created automatically.

#### Request Example

```json
{
  "enabled": true,
  "routes": {
    "create": true,
    "createBulk": true,
    "findAll": true,
    "findOne": true,
    "put": true,
    "update": true,
    "updateBulk": true,
    "delete": true,
    "deleteSoft": true,
    "deleteBulk": true,
    "restore": true,
    "restoreBulk": true,
    "count": true
  },
  "props": { "otherProp": "value" }
}
```

#### Response

```json
{
  "success": true,
  "model": "User",
  "updates": { ... }
}
```

### POST `/config/reload`

Forces a full reload of the configuration cache from the database.

#### Response

```json
{
  "success": true,
  "message": "Configuration cache reloaded."
}
```

---

## 🧩 Integration with Crudify

Crudify uses ConfigService internally to determine if routes are enabled before execution.

### Example Integration

```ts
if (!this.configService.isRouteEnabled(modelName, routeName)) {
  throw new ForbiddenException(this.configService.notEnabledResponse(modelName, routeName));
}
```

This ensures that disabling a route in the Config collection instantly prevents access to that route.

---

## 🧰 Summary

| Component            | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| **Config Entity**    | MongoDB schema defining per-model CRUD configuration                        |
| **ConfigService**    | Handles caching, loading, and validation of route configuration             |
| **ConfigController** | Provides REST API for reading and updating configuration                    |
| **Integration**      | Used by CrudifyController to enforce route enable/disable logic dynamically |

---

## 🗄 Example MongoDB Collection

```json
[
  {
    "modelName": "User",
    "enabled": true,
    "routes": { "create": true, "update": false, "delete": true },
    "props": { "group": "admin" },
    "createdAt": "2025-11-07T10:00:00Z",
    "updatedAt": "2025-11-07T10:05:00Z"
  },
  {
    "modelName": "Product",
    "enabled": false,
    "routes": { "findAll": false, "findOne": false },
    "props": {},
    "createdAt": "2025-11-07T09:00:00Z",
    "updatedAt": "2025-11-07T09:30:00Z"
  }
]
```
