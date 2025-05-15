import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {request} from "../../test-helpers/context";

describe("ctx.idempotent", () => {
  describe("when the request method is idempotent", () => {
    it("should return true", () => {
      ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"].forEach(check);
      function check(method: string){
        const req = request() as any;
        req.method = method;
        assert.strictEqual(req.idempotent, true);
      }
    });
  });

  describe("when the request method is not idempotent", () => {
    it("should return false", () => {
      const req = request() as any;
      req.method = "POST";
      assert.strictEqual(req.idempotent, false);
    });
  });
});
