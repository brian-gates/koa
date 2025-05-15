import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {Stream} from "stream";
import createContext from "../../test-helpers/context";

describe("res.socket", () => {
  it("should return the request socket object", () => {
    const res = createContext().response as any;
    assert.strictEqual(res.socket instanceof Stream, true);
  });
});
