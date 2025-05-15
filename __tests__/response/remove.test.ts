"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import createContext from "../../test-helpers/context";

describe("ctx.remove(name)", () => {
  it("should remove a field", () => {
    const ctx = createContext() as any;
    ctx.set("x-foo", "bar");
    ctx.remove("x-foo");
    assert.deepStrictEqual(ctx.response.header, {});
  });
});
