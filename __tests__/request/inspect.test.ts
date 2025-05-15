
import assert from "node:assert/strict";
import {describe, it} from "node:test";
import * as util from "util";
import {request} from "../../test-helpers/context";

describe("req.inspect()", () => {
  describe("with no request.req present", () => {
    it("should return null", () => {
      const req = request() as any;
      req.method = "GET";
      delete req.req;
      assert(undefined === req.inspect());
      assert(util.inspect(req) === "undefined");
    });
  });

  it("should return a json representation", () => {
    const req = request() as any;
    req.method = "GET";
    req.url = "example.com";
    req.header.host = "example.com";

    const expected = {
      "method": "GET",
      "url": "example.com",
      "header": {
        "host": "example.com",
      },
    };

    assert.deepStrictEqual(req.inspect(), expected);
    assert.deepStrictEqual(util.inspect(req), util.inspect(expected));
  });
});
