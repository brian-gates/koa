import assert from "node:assert/strict";
import { describe, it } from "node:test";
import util from "util";
import Koa from "../..";

process.env.NODE_ENV = "test";
const app = new Koa();

describe("app.inspect()", () => {
  it("should work", () => {
    const str = util.inspect(app);
    assert.strictEqual(
      "{ subdomainOffset: 2, proxy: false, env: 'test' }",
      str,
    );
  });

  it("should return a json representation", () => {
    assert.deepStrictEqual(
      { subdomainOffset: 2, proxy: false, env: "test" },
      app.inspect(),
    );
  });
});
