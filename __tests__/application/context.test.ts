import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import Koa, { Context } from "../..";

// Extend Context for this test file only
type ExtendedContext = Context & {
  msg?: string;
};

describe("app.context", () => {
  const app1 = new Koa();
  // Add property to context for testing
  (app1.context as any).msg = "hello";
  const app2 = new Koa();

  it("should merge properties", async () => {
    app1.use(async (ctx) => {
      // Use type assertion with our extended type
      assert.strictEqual((ctx as ExtendedContext).msg, "hello");
      ctx.status = 204;
    });

    await request(app1.callback()).get("/").expect(204);
  });

  it("should not affect the original prototype", async () => {
    app2.use(async (ctx) => {
      // Use type assertion with our extended type
      assert.strictEqual((ctx as ExtendedContext).msg, undefined);
      ctx.status = 204;
    });

    await request(app2.callback()).get("/").expect(204);
  });
});
