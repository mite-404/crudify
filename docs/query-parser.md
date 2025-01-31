A flexible query parser that transforms URL query parameters into MongoDB queries. It supports filtering, sorting, pagination, field population, and complex logical operations.

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
