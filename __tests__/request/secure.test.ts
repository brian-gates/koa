
import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {request} from "../../test-helpers/context";

describe("req.secure", () => {
  it("should return true when encrypted", () => {
    const req = request();
    (req as any).req.socket = {"encrypted": true};
    assert.strictEqual(req.secure, true);
  });
});
