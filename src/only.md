# `only` Utility Function

## Purpose

The `only` function creates a subset of an object by picking only the specified keys. It's a lightweight utility to extract specific properties from objects without modifying the original object.

## Signature

```typescript
function only(obj: object, keys: string[]): object;
```

## Parameters

- `obj`: The source object to pick properties from
- `keys`: An array of property names to include in the result

## Return Value

A new object containing only the specified keys from the source object.

## Behavior

- Returns a fresh object (doesn't mutate the source)
- Skips keys with `null` or `undefined` values
- Ignores keys that don't exist in the source object
- Preserves property values by reference

## Usage Examples

### Basic Usage

```typescript
const user = {
  id: 123,
  name: "Alice",
  email: "alice@example.com",
  password: "secret",
  createdAt: "2023-01-01",
};

// Returns { id: 123, name: "Alice", email: "alice@example.com" }
const safeUser = only(user, ["id", "name", "email"]);
```

### Common Use Cases in Koa

1. **Creating safe objects for logging**:

   ```typescript
   logger.info(only(request, ["method", "url", "headers"]));
   ```

2. **Preparing data for responses**:

   ```typescript
   ctx.body = only(user, ["id", "username", "profile"]);
   ```

3. **Filtering internal properties**:

   ```typescript
   return only(this, ["subdomainOffset", "proxy", "env"]);
   ```

4. **Limiting data in error responses**:
   ```typescript
   ctx.body = only(error, ["message", "code", "details"]);
   ```

## Implementation

The implementation is intentionally simple and efficient:

```typescript
function only(obj: object, keys: string[]): object {
  const ret = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (obj[key] == null) continue;
    ret[key] = obj[key];
  }
  return ret;
}
```
