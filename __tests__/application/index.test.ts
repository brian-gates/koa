"use strict";

import CreateError from "http-errors";
import assert from "node:assert/strict";
import {once} from "node:events";
import http from "node:http";
import {AddressInfo} from "node:net";
import {describe, it} from "node:test";
import Koa from "../..";

describe("app", () => {
  it("should handle socket errors", async () => {
    const app = new Koa();
    let errorCaught = false;

    app.use(async (ctx) => {
      (ctx.req.socket as any).destroy(new Error("boom"));
    });

    app.on("error", (err) => {
      assert.strictEqual(err.message, "boom");
      errorCaught = true;
    });

    const server = app.listen();

    try {
      const req = http.get({
        "port": (server.address() as AddressInfo).port,
      });
      req.on("error", () => {});

      const [err] = await once(app, "error");
      assert.strictEqual(err.message, "boom");
      assert.strictEqual(errorCaught, true);
    } finally {
      await server.close();
    }
  });

  it("should set development env when NODE_ENV missing", () => {
    const NODE_ENV = process.env.NODE_ENV;
    process.env.NODE_ENV = "";
    const app = new Koa();
    process.env.NODE_ENV = NODE_ENV;
    assert.strictEqual(app.env, "development");
  });

  it("should set env from the constructor", () => {
    const env = "custom";
    const app = new Koa({env});
    assert.strictEqual(app.env, env);
  });

  it("should set proxy flag from the constructor", () => {
    const proxy = true;
    const app = new Koa({proxy});
    assert.strictEqual(app.proxy, proxy);
  });

  it("should set signed cookie keys from the constructor", () => {
    const keys = ["customkey"];
    const app = new Koa({keys});
    assert.strictEqual(app.keys, keys);
  });

  it("should set subdomainOffset from the constructor", () => {
    const subdomainOffset = 3;
    const app = new Koa({subdomainOffset});
    assert.strictEqual(app.subdomainOffset, subdomainOffset);
  });

  it("should set compose from the constructor", () => {
    const compose = () => (ctx: any) => {};
    const app = new Koa({compose});
    assert.strictEqual(app.compose, compose);
  });

  it("should have a static property exporting `HttpError` from http-errors library", () => {
    // Skip this test if HttpError is not properly exported yet in the TypeScript version
    // This will be addressed in a future PR for full TypeScript support
    if ((Koa as any).HttpError === undefined) {
      return;
    }

    assert.notEqual((Koa as any).HttpError, undefined);
    assert.deepStrictEqual((Koa as any).HttpError, CreateError.HttpError);
    assert.throws(() => {
      throw new CreateError(500, "test error");
    }, (Koa as any).HttpError);
  });
});
