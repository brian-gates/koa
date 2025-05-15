"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import createContext from "../../test-helpers/context";

describe("req.stale", () => {
  it("should be the inverse of req.fresh", () => {
    const ctx = createContext();
    ctx.status = 200;
    (ctx as any).method = "GET";
    (ctx.req as any).headers["if-none-match"] = '"123"';
    (ctx as any).set("ETag", '"123"');
    assert.strictEqual((ctx as any).fresh, true);
    assert.strictEqual((ctx as any).stale, false);
  });
});
