import assert from "node:assert/strict";
import { describe, it } from "node:test";
import only from "../dist/cjs/only";

type TestObject = Record<string, any>;

describe("only()", () => {
  it("should pick properties from an object", () => {
    const obj: TestObject = { a: 1, b: 2, c: 3, d: 4 };
    const result = only(obj, ["a", "c"]);

    assert.deepStrictEqual(result, { a: 1, c: 3 });
  });

  it("should skip null and undefined values", () => {
    const obj: TestObject = { a: 1, b: null, c: undefined, d: 4 };
    const result = only(obj, ["a", "b", "c", "d"]);

    assert.deepStrictEqual(result, { a: 1, d: 4 });
  });

  it("should ignore keys that do not exist in the source object", () => {
    const obj: TestObject = { a: 1, b: 2 };
    const result = only(obj, ["a", "x", "y"]);

    assert.deepStrictEqual(result, { a: 1 });
  });

  it("should return an empty object when no keys are provided", () => {
    const obj: TestObject = { a: 1, b: 2 };
    const result = only(obj, []);

    assert.deepStrictEqual(result, {});
  });

  it("should work with empty objects", () => {
    const obj: TestObject = {};
    const result = only(obj, ["a", "b"]);

    assert.deepStrictEqual(result, {});
  });

  it("should preserve object references", () => {
    const nested = { x: 1 };
    const obj: TestObject = { a: nested, b: 2 };
    const result = only(obj, ["a"]);

    assert.strictEqual(result.a, nested);

    nested.x = 100;
    assert.strictEqual(result.a.x, 100);
  });

  it("should handle arrays as property values", () => {
    const obj: TestObject = { a: [1, 2, 3], b: 2 };
    const result = only(obj, ["a"]);

    assert.deepStrictEqual(result, { a: [1, 2, 3] });
  });

  it("should be used for picking specific request properties", () => {
    const request: TestObject = {
      method: "GET",
      url: "/users",
      headers: { "content-type": "application/json" },
      body: { token: "secret" },
      _internal: { session: {} },
    };

    const safeRequest = only(request, ["method", "url", "headers"]);

    assert.deepStrictEqual(safeRequest, {
      method: "GET",
      url: "/users",
      headers: { "content-type": "application/json" },
    });
  });
});
