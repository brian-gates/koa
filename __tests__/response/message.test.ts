"use strict";

import assert from "node:assert/strict";
import {describe, it} from "node:test";
import createContext from "../../test-helpers/context";

describe("res.message", () => {
  it("should return the response status message", () => {
    const res = createContext().response as any;
    res.status = 200;
    assert.strictEqual(res.message, "OK");
  });

  describe("when res.message not present", () => {
    it("should look up in statuses", () => {
      const res = createContext().response as any;
      res.res.statusCode = 200;
      assert.strictEqual(res.message, "OK");
    });
  });
});

describe("res.message=", () => {
  it("should set response status message", () => {
    const res = createContext().response as any;
    res.status = 200;
    res.message = "ok";
    assert.strictEqual(res.res.statusMessage, "ok");
    assert.strictEqual(res.inspect().message, "ok");
  });
});
