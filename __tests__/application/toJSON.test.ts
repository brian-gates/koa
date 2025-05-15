"use strict";

import assert from "node:assert/strict";
import {describe, it} from "node:test";
import Koa from "../..";

describe("app.toJSON()", () => {
  it("should work", () => {
    const app = new Koa({"env": "test"});
    const obj = app.toJSON();

    assert.deepStrictEqual(
      {
        "subdomainOffset": 2,
        "proxy": false,
        "env": "test",
      },
      obj
    );
  });
});
