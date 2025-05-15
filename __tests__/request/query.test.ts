import assert from "node:assert/strict";
import {describe, it} from "node:test";
import createContext from "../../test-helpers/context";

describe("ctx.query", () => {
  describe("when missing", () => {
    it("should return an empty object", () => {
      const ctx = createContext({"url": "/"}) as any;
      assert(!Object.keys(ctx.query).length);
    });

    it("should return the same object each time it's accessed", () => {
      const ctx = createContext({"url": "/"}) as any;
      ctx.query.a = "2";
      assert.strictEqual(ctx.query.a, "2");
    });
  });

  it("should return a parsed query string", () => {
    const ctx = createContext({"url": "/?page=2"}) as any;
    assert.strictEqual(ctx.query.page, "2");
  });
});

describe("ctx.query=", () => {
  it("should stringify and replace the query string and search", () => {
    const ctx = createContext({"url": "/store/shoes"}) as any;
    ctx.query = {"page": 2, "color": "blue"};
    assert.strictEqual(ctx.url, "/store/shoes?page=2&color=blue");
    assert.strictEqual(ctx.querystring, "page=2&color=blue");
    assert.strictEqual(ctx.search, "?page=2&color=blue");
  });

  it("should change .url but not .originalUrl", () => {
    const ctx = createContext({"url": "/store/shoes"}) as any;
    ctx.query = {"page": 2};
    assert.strictEqual(ctx.url, "/store/shoes?page=2");
    assert.strictEqual(ctx.originalUrl, "/store/shoes");
    assert.strictEqual(ctx.request.originalUrl, "/store/shoes");
  });
});
