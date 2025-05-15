"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import createContext from "../../test-helpers/context";

describe("ctx.get(name)", () => {
  it("should return the field value", () => {
    const ctx = createContext() as any;
    ctx.req.headers.host = "http://google.com";
    ctx.req.headers.referer = "http://google.com";
    assert.strictEqual(ctx.get("HOST"), "http://google.com");
    assert.strictEqual(ctx.get("Host"), "http://google.com");
    assert.strictEqual(ctx.get("host"), "http://google.com");
    assert.strictEqual(ctx.get("referer"), "http://google.com");
    assert.strictEqual(ctx.get("referrer"), "http://google.com");
  });
});
