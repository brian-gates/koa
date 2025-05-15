
import assert from "node:assert/strict";
import {describe, it} from "node:test";
import request from "supertest";
import Koa from "../..";

describe("app.request", () => {
  const app1 = new Koa();
  (app1.request as any).message = "hello";
  const app2 = new Koa();

  it("should merge properties", () => {
    app1.use(async (ctx) => {
      assert.strictEqual((ctx.request as any).message, "hello");
      ctx.status = 204;
    });

    return request(app1.callback()).get("/").expect(204);
  });

  it("should not affect the original prototype", () => {
    app2.use(async (ctx) => {
      assert.strictEqual((ctx.request as any).message, undefined);
      ctx.status = 204;
    });

    return request(app2.callback()).get("/").expect(204);
  });
});
