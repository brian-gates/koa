"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import Koa from "../..";

describe("app.context", () => {
  const app1 = new Koa();
  (app1.context as any).msg = "hello";
  const app2 = new Koa();

  it("should merge properties", () => {
    app1.use(async (ctx) => {
      assert.strictEqual((ctx as any).msg, "hello");
      ctx.status = 204;
    });

    return request(app1.callback()).get("/").expect(204);
  });

  it("should not affect the original prototype", () => {
    app2.use(async (ctx) => {
      assert.strictEqual((ctx as any).msg, undefined);
      ctx.status = 204;
    });

    return request(app2.callback()).get("/").expect(204);
  });
});
