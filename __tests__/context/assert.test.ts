import assert from "node:assert/strict";
import {describe, it} from "node:test";
import createContext from "../../test-helpers/context";

describe("ctx.assert(value, status)", () => {
  it("should throw an error", () => {
    const ctx = createContext() as any;

    let assertionRan = false;
    try {
      ctx.assert(false, 404, "custom message");
      throw new Error("should not reach here");
    } catch (err: any) {
      assertionRan = true;
      assert.strictEqual(err.status, 404);
      assert.strictEqual(err.message, "custom message");
      assert.strictEqual(err.expose, true);
    }
    assert(assertionRan);
  });
});
