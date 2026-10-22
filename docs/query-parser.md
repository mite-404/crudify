# Query parser

Crudify converts HTTP query parameters into a MongoDB query. The parser is used by:

- `GET /:model` (`findAll`)
- `GET /:model/count`
- `GET /audit`

The parser is exported as `QueryParser` and can also be used directly in custom services.

## Express configuration

Crudify filters use bracket notation:

```
GET /users?age[gte]=18&status[in]=active,pending
```

With Express, enable the extended query parser in `main.ts`:

```ts
app.set("query parser", "extended");
```

Without this setting, nested filters, arrays and bracket notation may be parsed incorrectly.

## Parser output

The parser returns an object with this shape:

```ts
{
  filters: Record<string, any>;
  populate: any[];
  sort: Record<string, 1 | -1>;
  skip: number;
  limit: number;
}
```

`QueryParser.parse()` always returns all five properties:

```ts
import { QueryParser } from "ncrudify";

const result = QueryParser.parse({
  "age[gte]": "18",
  status: ["active", "pending"],
  sort: "-createdAt",
  limit: "10",
});

// {
//   filters: {
//     age: { $gte: 18 },
//     status: { $in: ["active", "pending"] }
//   },
//   populate: [],
//   sort: { createdAt: -1 },
//   skip: 0,
//   limit: 10
// }
```

## Filters

### Scalar equality

```
GET /users?name=John
GET /users?name[eq]=John
```

Both produce:

```ts
{ name: { $eq: "John" } }
```

or, for the simple form, `{ name: "John" }`.

### Object operators

```
GET /users?age[gte]=18&age[lte]=65
```

produces:

```ts
{
  age: {
    $gte: 18,
    $lte: 65
  }
}
```

### Arrays and repeated parameters

Repeated parameters are converted to `$in`:

```
GET /users?status=active&status=pending
```

```ts
{ status: { $in: ["active", "pending"] } }
```

Comma-separated values are accepted by `in` and `notin`:

```
GET /users?status[in]=active,pending
```

```ts
{ status: { $in: ["active", "pending"] } }
```

## Operators

| Operator  | Meaning                              | MongoDB equivalent | Example                          |
| --------- | ------------------------------------ | ------------------ | -------------------------------- |
| `eq`      | Equals                               | `$eq`              | `name[eq]=John`                  |
| `ne`      | Not equals                           | `$ne`              | `age[ne]=25`                     |
| `gt`      | Greater than                         | `$gt`              | `age[gt]=18`                     |
| `gte`     | Greater than or equal                | `$gte`             | `age[gte]=18`                    |
| `lt`      | Less than                            | `$lt`              | `price[lt]=100`                  |
| `lte`     | Less than or equal                   | `$lte`             | `price[lte]=100`                 |
| `starts`  | Starts with, case-insensitive        | `$regex`           | `email[starts]=john`             |
| `ends`    | Ends with, case-insensitive          | `$regex`           | `email[ends]=gmail.com`          |
| `cont`    | Contains, case-insensitive           | `$regex`           | `name[cont]=oh`                  |
| `excl`    | Does not contain, case-insensitive   | `$not` + `$regex`  | `name[excl]=test`                |
| `in`      | Value is in a list                   | `$in`              | `status[in]=active,pending`      |
| `notin`   | Value is not in a list               | `$nin`             | `status[notin]=deleted,archived` |
| `isnull`  | Field is null or missing             | `$eq: null`        | `deletedAt[isnull]=true`         |
| `notnull` | Field is not null or missing         | `$ne: null`        | `email[notnull]=true`            |
| `between` | Inclusive range                      | `$gte` + `$lte`    | `age[between]=18,25`             |

Unknown operators are ignored.

### Equality and comparison

```
GET /users?age[gt]=18
GET /users?age[gte]=18
GET /users?age[lt]=65
GET /users?age[lte]=65
GET /users?age[ne]=0
```

```ts
{
  age: {
    $gt: 18,
    $gte: 18,
    $lt: 65,
    $lte: 65,
    $ne: 0
  }
}
```

### Regular expressions

`starts`, `ends`, `cont` and `excl` treat their input as literal text. Characters such as `.`, `+`, `*`, `(`, `)` and `[` are escaped automatically.

```
GET /users?email[starts]=john
GET /users?email[ends]=gmail.com
GET /users?name[cont]=oh
GET /users?name[excl]=test
```

`cont` accepts multiple values. Multiple `cont` conditions are combined with AND by default:

```
GET /users?name[cont]=jo&name[cont]=hn
```

This matches names that contain both `jo` and `hn` in sequence, because the parser builds a combined regular expression. Use `_op=or` if you need OR semantics.

### `isnull` and `notnull`

```
GET /users?deletedAt[isnull]=true
```

```ts
{ deletedAt: { $eq: null } }
```

```
GET /users?email[notnull]=true
```

```ts
{ email: { $ne: null } }
```

`isnull=false` behaves like `notnull=true`, and `notnull=false` behaves like `isnull=true`.

### `between`

```
GET /users?age[between]=18,25
```

```ts
{ age: { $gte: 18, $lte: 25 } }
```

The range is inclusive.

### `in` and `notin`

```
GET /users?status[in]=active,pending
GET /users?status[notin]=deleted,archived
```

```ts
{ status: { $in: ["active", "pending"] } }
{ status: { $nin: ["deleted", "archived"] } }
```

## Logical operators

Use `field_op=or` to combine regex conditions on the same field with OR. The default is AND.

```
# Starts with "john" AND ends with "gmail.com"
GET /users?email[starts]=john&email[ends]=gmail.com

# Starts with "john" OR ends with "gmail.com"
GET /users?email[starts]=john&email[ends]=gmail.com&email_op=or
```

Multiple OR groups are combined into `$and`:

```
GET /users?email[starts]=john&email_op=or&name[starts]=jane&name_op=or
```

```ts
{
  $and: [
    { $or: [ ...email conditions... ] },
    { $or: [ ...name conditions... ] }
  ]
}
```

`_op` applies to regex-based conditions (`starts`, `ends`, `cont`). It does not change the behavior of comparison operators.

## Sorting

Use `sort` with a comma-separated list:

- `field` = ascending
- `-field` = descending

```
GET /users?sort=name
GET /users?sort=-createdAt
GET /users?sort=status,-createdAt
```

Sort field names are validated with the same safety rules as filters.

## Pagination

| Parameter | Default | Description                                      |
| --------- | ------- | ------------------------------------------------ |
| `skip`    | `0`     | Number of documents to skip.                     |
| `limit`   | `0`     | Maximum documents to return. `0` means no limit. |

```
GET /users?limit=10
GET /users?skip=20&limit=10
```

Both values are converted to non-negative integers. Decimal values are truncated and negative values become `0`. Invalid values are ignored.

`findAll` computes the one-based page number:

```ts
page = limit > 0 ? Math.floor(skip / limit) + 1 : 1;
```

## Population

Use `populate` with a comma-separated list of paths:

```
GET /users?populate=posts
GET /users?populate=posts,comments
GET /users?populate=posts.author,posts.comments
```

The parser produces:

```ts
[
  { path: "posts" },
  { path: "comments" },
  { path: "posts.author" },
  { path: "posts.comments" }
]
```

Duplicate paths are removed.

Only comma-separated paths are supported. Per-path options such as `select`, nested filters or per-path sorting must be implemented in a custom service method.

## Value casting

String values are automatically converted:

| Input             | Result    |
| ----------------- | --------- |
| `18`              | `18`      |
| `18.5`            | `18.5`    |
| `true`            | `true`    |
| `false`           | `false`   |
| `2026-10-22`      | `Date`    |
| `2026-10-22T10:00:00.000Z` | `Date` |
| `John`            | `"John"`  |

Dates are detected with an ISO-like pattern. Numeric-looking strings are converted to numbers, so an identifier such as `"00123"` becomes `123`. If a field must keep its string form, use a custom service method or a DTO/query normalization layer.

The special string `"null"` is converted to `null` for comparison operators.

## Safety rules

### Field names

Unsafe field names are ignored. A field name is rejected when:

- It is empty.
- It starts with `$`.
- Any dot-separated segment starts with `$`.
- Any segment is `__proto__`, `constructor` or `prototype`.

Dot notation is allowed:

```
GET /users?profile.city[eq]=Milan
```

```ts
{ "profile.city": { $eq: "Milan" } }
```

### Regular expressions

Regex input is escaped before it is passed to MongoDB. Users cannot inject arbitrary regular expressions through `starts`, `ends`, `cont` or `excl`.

### Projection and update operators

Query parameters are only used for filters, sorting, pagination and population. They cannot set MongoDB projection or update operators.

## Complete examples

### Users older than 18

```
GET /users?age[gte]=18
```

### Users with Gmail addresses

```
GET /users?email[ends]=gmail.com
```

### Active or pending users

```
GET /users?status[in]=active,pending
```

### Users between 25 and 35, newest first

```
GET /users?age[between]=25,35&sort=-createdAt&limit=10
```

### Complex user query

```
GET /users?name[starts]=john&email[ends]=gmail.com&email_op=and&age[between]=25,35&status[in]=active,premium&sort=-createdAt&limit=10&populate=posts,comments
```

This query:

1. Filters names starting with `john`.
2. Filters emails ending with `gmail.com`.
3. Combines the two email regex conditions with AND.
4. Keeps ages between 25 and 35.
5. Keeps statuses `active` or `premium`.
6. Sorts by newest first.
7. Limits the result to 10 documents.
8. Populates `posts` and `comments`.

### Posts query with pagination

```
GET /posts?title[cont]=javascript&status[eq]=published&tags[in]=tutorial,nodejs&populate=author,comments&sort=-views,title&skip=20&limit=10
```

## Direct parser usage

```ts
import { QueryParser } from "ncrudify";

const { filters, populate, sort, skip, limit } = QueryParser.parse({
  "price[gte]": "100",
  "price[lte]": "500",
  "tags[in]": "node,nest",
  sort: "-createdAt",
  limit: "20",
});

const products = await this.productModel
  .find(filters)
  .populate(populate)
  .sort(sort)
  .skip(skip)
  .limit(limit)
  .exec();
```

`QueryParser.castValue()` is public and can be used to apply the same value casting elsewhere.

## Related documentation

- [Routes](routes.md)
- [API reference](api-reference.md)
- [Troubleshooting](troubleshooting.md)
