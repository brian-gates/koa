"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import createContext from "../../test-helpers/context";

describe("ctx.back([alt])", () => {
  it("should redirect to Referrer", () => {
    const ctx = createContext() as any;
    ctx.req.headers.referrer = "/login";
    ctx.back();
    assert.equal(ctx.response.header.location, "/login");
  });

  it("should redirect to Referer", () => {
    const ctx = createContext() as any;
    ctx.req.headers.referer = "/login";
    ctx.back();
    assert.equal(ctx.response.header.location, "/login");
  });

  it("should default to alt", () => {
    const ctx = createContext() as any;
    ctx.back("/index.html");
    assert.equal(ctx.response.header.location, "/index.html");
  });

  it("should default redirect to /", () => {
    const ctx = createContext() as any;
    ctx.back();
    assert.equal(ctx.response.header.location, "/");
  });
});
