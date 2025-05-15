import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parse, stringify } from "../../src/search-params";

describe("search-params", () => {
  describe("stringify", () => {
    it("Should stringify a simple object", () => {
      assert.deepStrictEqual(stringify({ a: 1, b: "b" }), "a=1&b=b");
    });

    it("Should stringify an object with an array", () => {
      assert.deepStrictEqual(stringify({ a: [1, 2] }), "a=1&a=2");
    });

    it("Should stringify an object with an array with a single value", () => {
      assert.deepStrictEqual(stringify({ a: [1] }), "a=1");
    });

    it("Stringify an object with an array with a single empty value", () => {
      assert.deepStrictEqual(stringify({ a: [""] }), "a=");
    });

    it("Should not stringify an object with a nested object", () => {
      assert.deepStrictEqual(stringify({ a: { b: 1 } }), "a=");
    });
  });

  describe("parse", () => {
    it("Should parse a simple query string", () => {
      assert.deepStrictEqual(parse("a=1&b=2"), { a: "1", b: "2" });
    });

    it("Should parse a query string with same key and multiple values", () => {
      assert.deepEqual(parse("a=1&a=2"), { a: ["1", "2"] });
    });

    it("Should parse a query string with an array with a single empty value", () => {
      assert.deepStrictEqual(parse("a="), { a: "" });
    });
  });
});
