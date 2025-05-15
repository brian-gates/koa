import assert from "node:assert/strict";
import {describe, it} from "node:test";
import util from "util";
import prototype from "../../lib/context";
import createContext from "../../test-helpers/context";

describe("ctx.inspect()", () => {
  it("should return a json representation", () => {
    const ctx = createContext() as any;
    const toJSON = ctx.toJSON(ctx);

    assert.deepStrictEqual(toJSON, ctx.inspect());
    assert.deepStrictEqual(util.inspect(toJSON), util.inspect(ctx));
  });

  // console.log(require.cache) will call prototype.inspect()
  it("should not crash when called on the prototype", () => {
    assert.deepStrictEqual(prototype, prototype.inspect());
    assert.deepStrictEqual(
      util.inspect(prototype.inspect()),
      util.inspect(prototype)
    );
  });
});
