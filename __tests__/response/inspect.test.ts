"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import util from "util";
import { response } from "../../test-helpers/context";

describe("res.inspect()", () => {
  describe("with no response.res present", () => {
    it("should return null", () => {
      const res = response() as any;
      res.body = "hello";
      delete res.res;
      assert.strictEqual(res.inspect(), undefined);
      assert.strictEqual(util.inspect(res), "undefined");
    });
  });

  it("should return a json representation", () => {
    const res = response() as any;
    res.body = "hello";

    const expected = {
      status: 200,
      message: "OK",
      header: {
        "content-type": "text/plain; charset=utf-8",
        "content-length": 5,
      },
      body: "hello",
    };

    assert.deepStrictEqual(res.inspect(), expected);
    assert.deepStrictEqual(util.inspect(res), util.inspect(expected));
  });
});
