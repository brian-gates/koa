import * as koaESM from "koa";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// For CommonJS import
const koaCJS = require("../");

type KoaModule = typeof koaESM;

describe("Load with esm", () => {
  it("should default export koa", async () => {
    const exported = await import("koa");
    assert.strictEqual(exported.default, koaCJS);
  });

  it("should match exports own property names", async () => {
    const exported = new Set(Object.getOwnPropertyNames(await import("koa")));
    const required = new Set(Object.getOwnPropertyNames(koaCJS));

    // Remove constructor properties + default export.
    for (const k of ["prototype", "length", "name"]) {
      required.delete(k);
    }

    // Commented out to "fix" CommonJS, ESM, bundling issue.
    // @see https://github.com/koajs/koa/issues/1513
    // exported.delete('default');

    assert.strictEqual(exported.size, required.size);
    assert.strictEqual(
      [...exported].every((property) => required.has(property)),
      true
    );
  });

  it("CommonJS exports default property", async () => {
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(koaCJS, "default"),
      true
    );
  });

  it("CommonJS exports default property referencing self", async () => {
    assert.strictEqual(koaCJS.default, koaCJS);
  });
});
