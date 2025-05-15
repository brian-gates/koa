import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import Koa from "../..";

describe("app.response", () => {
  const app1 = new Koa();
  (app1.response as any).msg = "hello";
  const app2 = new Koa();
  const app3 = new Koa();
  const app4 = new Koa();
  const app5 = new Koa();
  const app6 = new Koa();
  const app7 = new Koa();

  it("should merge properties", async () => {
    app1.use(async (ctx) => {
      assert.strictEqual((ctx.response as any).msg, "hello");
      ctx.status = 204;
    });

    await request(app1.callback()).get("/").expect(204);
  });

  it("should not affect the original prototype", async () => {
    app2.use(async (ctx) => {
      assert.strictEqual((ctx.response as any).msg, undefined);
      ctx.status = 204;
    });

    await request(app2.callback()).get("/").expect(204);
  });

  it("should not include status message in body for http2", async () => {
    app3.use(async (ctx) => {
      (ctx.req as any).httpVersionMajor = 2;
      ctx.status = 404;
    });
    const response = await request(app3.callback()).get("/").expect(404);
    assert.strictEqual(response.text, "404");
  });

  it("should set ._explicitNullBody correctly", async () => {
    app4.use(async (ctx) => {
      ctx.body = null;
      assert.strictEqual((ctx.response as any)._explicitNullBody, true);
    });

    await request(app4.callback()).get("/").expect(204);
  });

  it("should not set ._explicitNullBody incorrectly", async () => {
    app5.use(async (ctx) => {
      ctx.body = undefined;
      assert.strictEqual((ctx.response as any)._explicitNullBody, undefined);
      ctx.body = "";
      assert.strictEqual((ctx.response as any)._explicitNullBody, undefined);
      ctx.body = {} as any;
      assert.strictEqual((ctx.response as any)._explicitNullBody, undefined);
    });

    await request(app5.callback()).get("/").expect(204);
  });

  it("should add Content-Length when Transfer-Encoding is not defined", async () => {
    app6.use(async (ctx) => {
      ctx.body = "hello world";
    });

    await request(app6.callback())
      .get("/")
      .expect("Content-Length", "11")
      .expect(200);
  });

  it("should not add Content-Length when Transfer-Encoding is defined", async () => {
    app7.use(async (ctx) => {
      ctx.response.set("Transfer-Encoding", "chunked");
      ctx.body = "hello world";
      assert.strictEqual(
        (ctx.response as any).get("Content-Length"),
        undefined,
      );
    });

    await request(app7.callback())
      .get("/")
      .expect("Transfer-Encoding", "chunked")
      .expect(200);
  });
});
