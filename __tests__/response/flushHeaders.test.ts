import http from "http";
import { AddressInfo } from "net";
import assert from "node:assert/strict";
import { once } from "node:events";
import { describe, it } from "node:test";
import { PassThrough } from "stream";
import request from "supertest";
import Koa from "../..";

describe("ctx.flushHeaders()", () => {
  it("should set headersSent", async () => {
    const app = new Koa();

    app.use(async (ctx) => {
      ctx.body = "Body";
      ctx.status = 200;
      ctx.flushHeaders();
      assert.strictEqual(ctx.headerSent, true);
      assert.strictEqual(ctx.res.headersSent, true);
    });

    await request(app.callback()).get("/").expect(200).expect("Body");
  });

  it("should allow a response afterwards", async () => {
    const app = new Koa();

    app.use(async (ctx) => {
      ctx.status = 200;
      ctx.res.setHeader("Content-Type", "text/plain");
      ctx.flushHeaders();
      ctx.body = "Body";
    });

    await request(app.callback())
      .get("/")
      .expect(200)
      .expect("Content-Type", "text/plain")
      .expect("Body");
  });

  it("should send the correct status code", async () => {
    const app = new Koa();

    app.use(async (ctx) => {
      ctx.status = 401;
      ctx.res.setHeader("Content-Type", "text/plain");
      ctx.flushHeaders();
      ctx.body = "Body";
    });

    await request(app.callback())
      .get("/")
      .expect(401)
      .expect("Content-Type", "text/plain")
      .expect("Body");
  });

  it("should ignore set header after flushHeaders", async () => {
    const app = new Koa();

    app.use(async (ctx) => {
      ctx.status = 401;
      ctx.res.setHeader("Content-Type", "text/plain");
      ctx.flushHeaders();
      ctx.body = "foo";
      ctx.set("X-Shouldnt-Work", "Value");
      ctx.remove("Content-Type");
      ctx.vary("Content-Type");
    });

    const res = await request(app.callback())
      .get("/")
      .expect(401)
      .expect("Content-Type", "text/plain");

    assert.strictEqual(
      res.headers["x-shouldnt-work"],
      undefined,
      "header set after flushHeaders",
    );
    assert.strictEqual(
      res.headers.vary,
      undefined,
      "header set after flushHeaders",
    );
  });

  it("should flush headers first and delay to send data", async () => {
    const app = new Koa();
    let headersFlushed = false;
    let dataReceived = false;

    app.use(async (ctx) => {
      ctx.type = "json";
      ctx.status = 200;
      ctx.headers.Link =
        "</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin";
      const stream = (ctx.body = new PassThrough());
      ctx.flushHeaders();
      headersFlushed = true;
      setTimeout(() => {
        stream.end(JSON.stringify({ message: "hello!" }));
      }, 10);
    });

    const server = app.listen();
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;

    try {
      const req = http.request({ port });
      req.end();

      const [res] = await once(req, "response");
      assert(headersFlushed, "Headers should be flushed");

      const dataPromise = new Promise((resolve) => {
        res.once("data", (chunk) => {
          dataReceived = true;
          resolve(chunk);
        });
      });

      // Wait for data with a timeout
      const timeoutPromise = new Promise<Buffer>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout waiting for data")), 100),
      );

      await Promise.race([dataPromise, timeoutPromise]);
      res.destroy();
      assert(dataReceived, "Data should be received after headers");
    } finally {
      server.close();
    }
  });

  it("should catch stream error", async () => {
    const app = new Koa();
    app.once("error", (err) => {
      assert(err.message === "mock error");
    });

    app.use(async (ctx) => {
      ctx.type = "json";
      ctx.status = 200;
      ctx.headers.Link =
        "</css/mycss.css>; as=style; rel=preload, <https://img.craftflair.com>; rel=preconnect; crossorigin";
      ctx.length = 20;
      ctx.flushHeaders();
      const stream = (ctx.body = new PassThrough());

      setTimeout(() => {
        stream.emit("error", new Error("mock error"));
        stream.end();
      });
    });

    await request(app.callback())
      .get("/")
      .then(() => {
        throw new Error("should not successfully end");
      })
      .catch((err) => {
        assert(err.message === "aborted");
      });
  });
});
