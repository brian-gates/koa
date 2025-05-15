"use strict";

import assert from "node:assert/strict";
import {describe, it} from "node:test";
import createContext from "../../test-helpers/context";

describe("ctx.search=", () => {
  it("should replace the search", () => {
    const ctx = createContext({"url": "/store/shoes"});
    (ctx as any).search = "?page=2&color=blue";
    assert.strictEqual((ctx as any).url, "/store/shoes?page=2&color=blue");
    assert.strictEqual((ctx as any).search, "?page=2&color=blue");
  });

  it("should update ctx.querystring and ctx.query", () => {
    const ctx = createContext({"url": "/store/shoes"});
    (ctx as any).search = "?page=2&color=blue";
    assert.strictEqual((ctx as any).url, "/store/shoes?page=2&color=blue");
    assert.strictEqual((ctx as any).querystring, "page=2&color=blue");
    assert.strictEqual((ctx as any).query.page, "2");
    assert.strictEqual((ctx as any).query.color, "blue");
  });

  it("should change .url but not .originalUrl", () => {
    const ctx = createContext({"url": "/store/shoes"});
    (ctx as any).search = "?page=2&color=blue";
    assert.strictEqual((ctx as any).url, "/store/shoes?page=2&color=blue");
    assert.strictEqual((ctx as any).originalUrl, "/store/shoes");
    assert.strictEqual((ctx.request as any).originalUrl, "/store/shoes");
  });

  describe("when missing", () => {
    it('should return ""', () => {
      const ctx = createContext({"url": "/store/shoes"});
      assert.strictEqual((ctx as any).search, "");
    });
  });
});
