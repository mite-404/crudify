# Generated routes

For a controller mounted at `@Controller("users")`, Crudify registers the following routes.

Assume:

```ts
@Crudify({
  model: {
    type: User,
    cdto: CreateUserDto,
    udto: UpdateUserDto,
    schema: UserSchema,
  },
})
@Controller("users")
export class UserController extends CrudifyController<User> {}
```

## Route summary

| Method   | Path                    | Service method   | Request body                 | Success response                     |
| -------- | ----------------------- | ---------------- | ---------------------------- | ------------------------------------ |
| `POST`   | `/users`                | `create`         | `CreateUserDto`              | Created document (`201`)             |
| `POST`   | `/users/bulk`           | `createBulk`     | `CreateUserDto[]`            | Inserted documents (`201`)           |
| `GET`    | `/users`                | `findAll`        | none                         | `{ results, total, page }`           |
| `GET`    | `/users/count`          | `count`          | none                         | `number`                             |
| `GET`    | `/users/:id`            | `findOne`        | none                         | Document or `null`                   |
| `PATCH`  | `/users/:id`            | `update`         | `UpdateUserDto`              | Updated document or `null`           |
| `PATCH`  | `/users/bulk`           | `updateBulk`     | `{ filter, updateDto }`      | MongoDB `updateMany` result          |
| `PUT`    | `/users/:id`            | `put`            | `UpdateUserDto`              | Replaced document or `null`          |
| `DELETE` | `/users/:id`            | `delete`         | none                         | Deleted document or `null`           |
| `DELETE` | `/users/:id/soft`       | `softDelete`     | none                         | Updated document or `null`           |
| `DELETE` | `/users/:id/restore`    | `restore`        | none                         | Updated document or `null`           |
| `DELETE` | `/users/bulk`           | `deleteBulk`     | `{ filter }`                 | MongoDB `deleteMany` result          |
| `PATCH`  | `/users/bulk/restore`   | `restoreBulk`    | `{ filter }`                 | MongoDB `updateMany` result          |

If your application uses a global prefix, prepend it to every path. For example, with `app.setGlobalPrefix("api")`, `POST /users` becomes `POST /api/users`.

## `POST /users`

Creates one document.

### Request

```http
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

### Response

```json
{
  "_id": "6a6b3a0753210eef9724d6c7",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "createdAt": "2026-10-22T10:00:00.000Z",
  "updatedAt": "2026-10-22T10:00:00.000Z",
  "__v": 0
}
```

Status: `201 Created`.

## `POST /users/bulk`

Creates many documents with `Model.insertMany()`.

### Request

```http
POST /users/bulk
Content-Type: application/json

[
  {
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
]
```

### Response

An array of the inserted documents.

Status: `201 Created`.

## `GET /users`

Returns a paginated list.

### Query parameters

| Parameter | Description                                                     |
| --------- | --------------------------------------------------------------- |
| filters   | Any field/operator pair, for example `age[gte]=18`.             |
| `sort`    | Comma-separated fields. Prefix with `-` for descending order.   |
| `skip`    | Number of documents to skip.                                    |
| `limit`   | Maximum number of documents to return. `0` means no limit.      |
| `populate`| Comma-separated reference paths.                                |

### Request

```http
GET /users?age[gte]=18&status[in]=active,pending&sort=-createdAt&skip=20&limit=10
```

### Response

```json
{
  "results": [
    {
      "_id": "6a6b3a0753210eef9724d6c7",
      "name": "John Doe",
      "age": 31,
      "status": "active"
    }
  ],
  "total": 42,
  "page": 3
}
```

`page` is one-based and is calculated as `floor(skip / limit) + 1`. When `limit` is `0`, `page` is `1`.

`findAll` does not throw `404` when no documents match. It returns an empty `results` array.

See [Query parser](query-parser.md) for the complete query language.

## `GET /users/count`

Returns the number of documents matching the same filters used by `findAll`.

### Request

```http
GET /users/count?age[gte]=18&status[in]=active,pending
```

### Response

```json
42
```

`count` ignores `skip`, `limit`, `sort` and `populate`.

## `GET /users/:id`

Finds one document by `_id`.

### Request

```http
GET /users/6a6b3a0753210eef9724d6c7
```

### Response

```json
{
  "_id": "6a6b3a0753210eef9724d6c7",
  "name": "John Doe"
}
```

If the document does not exist, the service returns `null`. Crudify does not throw `404` automatically.

An invalid ObjectId is converted by `CrudifyExceptionFilter` into a `400 Bad Request` response.

## `PATCH /users/:id`

Partially updates a document with `findOneAndUpdate(..., { new: true })`.

### Request

```http
PATCH /users/6a6b3a0753210eef9724d6c7
Content-Type: application/json

{
  "age": 31
}
```

### Response

The updated document, or `null` if it was not found.

## `PATCH /users/bulk`

Updates many documents by filter. The service applies:

```ts
model.updateMany(filter, { $set: updateDto })
```

### Request

```http
PATCH /users/bulk
Content-Type: application/json

{
  "filter": {
    "status": "inactive"
  },
  "updateDto": {
    "reviewed": true
  }
}
```

### Response

A MongoDB `updateMany` result, for example:

```json
{
  "acknowledged": true,
  "modifiedCount": 3,
  "upsertedId": null,
  "upsertedCount": 0,
  "matchedCount": 3
}
```

`updateDto` is passed as the value of `$set`. Do not include MongoDB update operators such as `$inc` or `$unset` inside `updateDto`.

## `PUT /users/:id`

Replaces a document with `findOneAndReplace(..., { new: true })`.

### Request

```http
PUT /users/6a6b3a0753210eef9724d6c7
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 32
}
```

### Response

The replaced document, or `null` if it was not found.

`PUT` replaces the complete document. Fields omitted from the body are removed, except `_id`.

## `DELETE /users/:id`

Deletes one document.

- When `softDelete` is `false` (default), calls `findByIdAndDelete`.
- When `softDelete` is `true`, sets `deletedAt` and keeps the document.

### Request

```http
DELETE /users/6a6b3a0753210eef9724d6c7
```

### Response

- Hard delete: the deleted document or `null`.
- Soft delete: the updated document with `deletedAt`.

## `DELETE /users/:id/soft`

Always performs a soft delete, regardless of the controller's `softDelete` option.

### Request

```http
DELETE /users/6a6b3a0753210eef9724d6c7/soft
```

### Response

The updated document with `deletedAt`, or `null` if it was not found.

## `DELETE /users/:id/restore`

Removes `deletedAt` from one document.

### Request

```http
DELETE /users/6a6b3a0753210eef9724d6c7/restore
```

### Response

The restored document, or `null` if it was not found.

## `DELETE /users/bulk`

Deletes many documents by filter.

- When `softDelete` is `false`, calls `deleteMany(filter)`.
- When `softDelete` is `true`, sets `deletedAt` on every matching document.

### Request

```http
DELETE /users/bulk
Content-Type: application/json

{
  "filter": {
    "status": "inactive"
  }
}
```

### Response

A MongoDB result:

```json
{
  "acknowledged": true,
  "deletedCount": 3
}
```

For soft delete, the response is an `updateMany` result.

## `PATCH /users/bulk/restore`

Removes `deletedAt` from every matching document.

### Request

```http
PATCH /users/bulk/restore
Content-Type: application/json

{
  "filter": {
    "status": "inactive"
  }
}
```

### Response

A MongoDB `updateMany` result.

## Disabled routes

A route can be disabled in two ways:

### At build time

```ts
@Crudify({
  model: { type: User },
  routes: {
    exclude: ["deleteBulk"],
    config: {
      delete: { disabled: true },
    },
  },
})
```

Excluded and disabled routes are hidden from Swagger and protected by `DisableRouteGuard`. Requests receive `403 Forbidden`.

### At runtime

Use the `/config` endpoints to disable a route for a model without redeploying:

```bash
curl -X PUT http://localhost:3000/config/User \
  -H "Content-Type: application/json" \
  -d '{"routes":{"delete":false}}'
```

The controller returns:

```json
{
  "success": false,
  "status": 403,
  "message": "The route 'delete' for model 'User' is currently disabled."
}
```

The HTTP status of this runtime response is normally `200`; inspect the `status` field in the body. See [Runtime configuration](config.md).

## Validation and transformation

The following routes use `ValidationPipe({ transform: true })`:

- `create`
- `createBulk`
- `findAll`
- `findOne`
- `update`
- `updateBulk`
- `put`
- `restore`
- `restoreBulk`

`@Crudify` passes `model.cdto` and `model.udto` to Swagger and validation metadata. `delete`, `deleteSoft`, `deleteBulk` and `count` do not use a body DTO.
