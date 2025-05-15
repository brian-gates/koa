# Koa TypeScript Migration Playbook

This document outlines the step-by-step process for converting JavaScript files to TypeScript in the Koa framework.

## Migration Progress

### Completed

- Core modules in `src/` directory

  - `only.ts`
  - `is-stream.ts`
  - `search-params.ts`
  - `context.ts`
  - `application.ts`
  - `request.ts`
  - `response.ts`
  - `index.ts`
  - Plus associated type definitions and tests

- Test files:
  - All files in `__tests__/request/` directory (30 files total)

### In Progress

- Converting remaining test files:
  - `__tests__/response/` - All files
  - `__tests__/context/` - All files
  - `__tests__/application/` - All files

## Running Tests

During the migration, TypeScript test files need to be run with ts-node:

```bash
# Run a specific TypeScript test file
npx ts-node __tests__/path/to/test.ts

# Run all TypeScript test files in a directory
find __tests__/path/to/dir -name "*.test.ts" | xargs npx ts-node
```

Note that TypeScript test files cannot be run directly with `node --test` until they are compiled to JavaScript.

## File Migration Workflow

1. **File Structure Changes**

   - Move files from `lib/` to `src/`
   - Rename file extension from `.js` to `.ts`
   - Use `git mv` to preserve file history when moving/renaming files:
     ```bash
     git mv lib/some-file.js src/some-file.ts
     ```
   - For tests, either keep tests in JavaScript or create TypeScript versions in the same directory using `git mv __tests__/path/test.js __tests__/path/test.ts`

2. **Code Conversion Steps**

   - Replace CommonJS `require()` statements with ES Module `import` statements
   - Replace `module.exports` with `export default` or named exports
   - Add type definitions for functions, parameters, and return values
   - Use TypeScript interfaces/types for complex objects

3. **Testing**
   - Use `.test.ts` extension for TypeScript tests
   - Run TypeScript tests with `npm run test:ts`

## Detailed Conversion Guide

### 1. Module Imports/Exports

**CommonJS (Before):**

```javascript
"use strict";

const path = require("path");
const util = require("util");
const escapeHtml = require("escape-html");
const onFinished = require("on-finished");
const only = require("./only");

module.exports = MyClass;
// OR
module.exports = {
  method1,
  method2,
};
```

**TypeScript (After):**

```typescript
import path from "path";
import * as util from "util";
import escapeHtml from "escape-html";
import onFinished from "on-finished";
import only from "~/only";

export default MyClass;
// OR
export { method1, method2 };
```

### 2. Class Definitions

**CommonJS (Before):**

```javascript
function Application() {
  if (!(this instanceof Application)) return new Application();
  this.proxy = false;
  this.middleware = [];
  this.env = process.env.NODE_ENV || "development";
}

Application.prototype.listen = function () {
  // implementation
};

module.exports = Application;
```

**TypeScript (After):**

```typescript
import { Middleware } from "./types";

class Application extends EventEmitter {
  proxy: boolean;
  middleware: Middleware[];
  env: string;

  constructor() {
    super();
    this.proxy = false;
    this.middleware = [];
    this.env = process.env.NODE_ENV || "development";
  }

  listen(...args: any[]): Server {
    // implementation
  }
}

export default Application;
```

### 3. Function Signatures

**CommonJS (Before):**

```javascript
function only(obj, keys) {
  const ret = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (obj[key] == null) continue;
    ret[key] = obj[key];
  }
  return ret;
}
```

**TypeScript (After - with inference):**

```typescript
function only(obj: { [key: string]: any }, keys: string[]) {
  const ret = {} as { [key: string]: any };
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (obj[key] == null) continue;
    ret[key] = obj[key];
  }
  return ret;
}

export default only;
```

### 4. Working with `this` Context

**CommonJS (Before):**

```javascript
const request = {
  get header() {
    return this.req.headers;
  },

  set header(val) {
    this.req.headers = val;
  },
};
```

**TypeScript (After):**

```typescript
const request = {
  get header(): Record<string, string | string[] | undefined> {
    return this.req.headers;
  },

  set header(val: Record<string, string | string[] | undefined>) {
    this.req.headers = val;
  },
};
```

### 5. Test Files

**CommonJS (Before):**

```javascript
"use strict";

const assert = require("assert");
const Koa = require("../lib/application");

describe("app", () => {
  it("should handle socket errors", (done) => {
    // Test implementation
  });
});
```

**TypeScript (After):**

```typescript
import assert from "assert";
import { describe, it } from "node:test";
import Koa from "../src/application";

describe("app", () => {
  it("should handle socket errors", (done) => {
    // Test implementation
  });
});
```

## Common Patterns

### Type Definitions

When complex types are needed, prefer inline definitions:

```typescript
// Instead of separate type declarations:
function processRequest(req: {
  url: string;
  method: string;
  headers: Record<string, string>;
}) {
  // Implementation
}

// For reusable types across multiple files, use a central types.ts:
// src/types.ts
export type Next = () => Promise<void>;

export type Middleware<StateT = any, ContextT = Context> = (
  ctx: ContextT,
  next: Next
) => any;
```

### Utility Functions

When converting utility functions, follow these patterns:

1. Let TypeScript infer return types when obvious
2. Only add explicit types when necessary for clarity
3. Use inline type definitions for parameters

### Test Helpers

For test helpers, use TypeScript to add proper typing to mocks and stubs:

```typescript
// test-helpers/context.ts
import { Duplex, Readable, Writable } from "stream";
import Application from "../src/application";

type Request = Partial<Readable> & {
  headers?: Record<string, string>;
  socket?: any;
  [key: string]: any;
};

// ...function implementation
```

## Troubleshooting

### Module Resolution

If you encounter issues with module resolution:

1. Prefer path aliases with `~/*` (maps to `src/`) for all internal imports
2. Use relative paths with `.js` extension only when necessary
3. Check `tsconfig.json` for proper module resolution settings

### Type Compatibility

When dealing with third-party libraries:

1. Check for `@types/package-name` if available
2. Create custom declaration files if needed
3. Use `any` temporarily but add TODO comments for future improvement

## Best Practices

1. Prefer types over interfaces for consistency
2. Favor type inference wherever possible - don't add explicit types when TypeScript can infer them
3. Use inline type definitions rather than separate type declarations when practical
4. Minimize use of `any` type
5. Prefer server rendering and server actions over client state
6. Avoid mutation when practical
7. Avoid comments in code (use descriptive variable/function names)
8. Keep code clean and focused
