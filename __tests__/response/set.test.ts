import assert from "node:assert/strict";
import {describe, it} from "node:test";
import createContext from "../../test-helpers/context";

describe("ctx.set(name, val)", () => {
  it("should set a field value", () => {
    const ctx = createContext() as any;
    ctx.set("x-foo", "bar");
    assert.strictEqual(ctx.response.get("x-foo"), "bar");
  });

  it("should coerce number to string", () => {
    const ctx = createContext() as any;
    ctx.set("x-foo", 5);
    assert.strictEqual(ctx.response.header["x-foo"], 5);
  });

  it("should coerce undefined to string", () => {
    const ctx = createContext() as any;
    ctx.set("x-foo", undefined);
    assert.strictEqual(ctx.response.header["x-foo"], undefined);
  });

  it("should set a field value of array", () => {
    const ctx = createContext() as any;
    ctx.set("x-foo", ["foo", "bar", 123]);
    assert.deepStrictEqual(ctx.response.header["x-foo"], ["foo", "bar", 123]);
  });
});

describe("ctx.set(object)", () => {
  it("should set multiple fields", () => {
    const ctx = createContext() as any;

    ctx.set({
      "foo": "1",
      "bar": "2",
    });

    assert.strictEqual(ctx.response.header.foo, "1");
    assert.strictEqual(ctx.response.header.bar, "2");
  });
});
