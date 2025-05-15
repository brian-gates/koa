"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import parseurl from "parseurl";
import createContext from "../../test-helpers/context";

describe("ctx.path", () => {
  it("should return the pathname", () => {
    const ctx = createContext() as any;
    ctx.url = "/login?next=/dashboard";
    assert.strictEqual(ctx.path, "/login");
  });
});

describe("ctx.path=", () => {
  it("should set the pathname", () => {
    const ctx = createContext() as any;
    ctx.url = "/login?next=/dashboard";

    ctx.path = "/logout";
    assert.strictEqual(ctx.path, "/logout");
    assert.strictEqual(ctx.url, "/logout?next=/dashboard");
  });

  it("should change .url but not .originalUrl", () => {
    const ctx = createContext({ url: "/login" }) as any;
    ctx.path = "/logout";
    assert.strictEqual(ctx.url, "/logout");
    assert.strictEqual(ctx.originalUrl, "/login");
    assert.strictEqual(ctx.request.originalUrl, "/login");
  });

  it("should not affect parseurl", () => {
    const ctx = createContext({ url: "/login?foo=bar" }) as any;
    ctx.path = "/login";
    const url = parseurl(ctx.req);
    assert.strictEqual(url.path, "/login?foo=bar");
  });
});
