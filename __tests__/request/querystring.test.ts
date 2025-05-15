"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import parseurl from "parseurl";
import createContext from "../../test-helpers/context";

describe("ctx.querystring", () => {
  it("should return the querystring", () => {
    const ctx = createContext({ url: "/store/shoes?page=2&color=blue" });
    assert.strictEqual((ctx as any).querystring, "page=2&color=blue");
  });

  describe("when ctx.req not present", () => {
    it("should return an empty string", () => {
      const ctx = createContext();
      (ctx.request as any).req = null;
      assert.strictEqual((ctx as any).querystring, "");
    });
  });
});

describe("ctx.querystring=", () => {
  it("should replace the querystring", () => {
    const ctx = createContext({ url: "/store/shoes" });
    (ctx as any).querystring = "page=2&color=blue";
    assert.strictEqual((ctx as any).url, "/store/shoes?page=2&color=blue");
    assert.strictEqual((ctx as any).querystring, "page=2&color=blue");
  });

  it("should update ctx.search and ctx.query", () => {
    const ctx = createContext({ url: "/store/shoes" });
    (ctx as any).querystring = "page=2&color=blue";
    assert.strictEqual((ctx as any).url, "/store/shoes?page=2&color=blue");
    assert.strictEqual((ctx as any).search, "?page=2&color=blue");
    assert.strictEqual((ctx as any).query.page, "2");
    assert.strictEqual((ctx as any).query.color, "blue");
  });

  it("should change .url but not .originalUrl", () => {
    const ctx = createContext({ url: "/store/shoes" });
    (ctx as any).querystring = "page=2&color=blue";
    assert.strictEqual((ctx as any).url, "/store/shoes?page=2&color=blue");
    assert.strictEqual((ctx as any).originalUrl, "/store/shoes");
    assert.strictEqual((ctx.request as any).originalUrl, "/store/shoes");
  });

  it("should not affect parseurl", () => {
    const ctx = createContext({ url: "/login?foo=bar" });
    (ctx as any).querystring = "foo=bar";
    const url = parseurl((ctx as any).req);
    assert.strictEqual(url.path, "/login?foo=bar");
  });
});
