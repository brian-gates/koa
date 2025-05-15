import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import statuses from "statuses";
import request from "supertest";
import Koa from "../..";

describe("app.respond", () => {
  describe("when ctx.respond === false", () => {
    it("should function (ctx)", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = "Hello";
        ctx.respond = false;

        const res = ctx.res;
        res.statusCode = 200;
        setImmediate(() => {
          res.setHeader("Content-Type", "text/plain");
          res.setHeader("Content-Length", "3");
          res.end("lol");
        });
      });

      await request(app.callback()).get("/").expect(200).expect("lol");
    });

    it("should ignore set header after header sent", async () => {
      const app = new Koa();
      app.use(async (ctx) => {
        ctx.body = "Hello";
        ctx.respond = false;

        const res = ctx.res;
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Length", "3");
        res.end("lol");
        ctx.response.set("foo", "bar");
      });

      await request(app.callback())
        .get("/")
        .expect(200)
        .expect("lol")
        .expect((res) => {
          assert(!res.headers.foo);
        });
    });

    it("should ignore set status after header sent", async () => {
      const app = new Koa();
      app.use(async (ctx) => {
        ctx.body = "Hello";
        ctx.respond = false;

        const res = ctx.res;
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Length", "3");
        res.end("lol");
        ctx.status = 201;
      });

      await request(app.callback()).get("/").expect(200).expect("lol");
    });
  });

  describe("when this.type === null", () => {
    it("should not send Content-Type header", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = "";
        ctx.response.type = null;
      });

      const res = await request(app.callback()).get("/").expect(200);

      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
        false,
      );
    });
  });

  describe("when HEAD is used", () => {
    it("should not respond with the body", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = "Hello";
      });

      const res = await request(app.callback()).head("/").expect(200);

      assert.strictEqual(
        res.headers["content-type"],
        "text/plain; charset=utf-8",
      );
      assert.strictEqual(res.headers["content-length"], "5");
      assert(!res.text);
    });

    it("should keep json headers", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = { hello: "world" };
      });

      const res = await request(app.callback()).head("/").expect(200);

      assert.strictEqual(
        res.headers["content-type"],
        "application/json; charset=utf-8",
      );
      assert.strictEqual(res.headers["content-length"], "17");
      assert(!res.text);
    });

    it("should keep string headers", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = "hello world";
      });

      const res = await request(app.callback()).head("/").expect(200);

      assert.strictEqual(
        res.headers["content-type"],
        "text/plain; charset=utf-8",
      );
      assert.strictEqual(res.headers["content-length"], "11");
      assert(!res.text);
    });

    it("should keep buffer headers", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = Buffer.from("hello world");
      });

      const res = await request(app.callback()).head("/").expect(200);

      assert.strictEqual(
        res.headers["content-type"],
        "application/octet-stream",
      );
      assert.strictEqual(res.headers["content-length"], "11");
      assert(!res.text);
    });

    it("should keep stream header if set manually", async () => {
      const app = new Koa();

      const { size } = fs.statSync("package.json");

      app.use(async (ctx) => {
        ctx.response.length = size;
        ctx.body = fs.createReadStream("package.json");
      });

      const res = await request(app.callback()).head("/").expect(200);

      assert.strictEqual(~~res.header["content-length"], size);
      assert(!res.text);
    });

    it("should respond with a 404 if no body was set", async () => {
      const app = new Koa();

      app.use(async () => {
        // No body set
      });

      await request(app.callback()).head("/").expect(404);
    });

    it("should respond with a 200 if body = ''", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = "";
      });

      await request(app.callback()).head("/").expect(200);
    });

    it("should not overwrite the content-type", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.status = 200;
        ctx.type = "application/javascript";
      });

      await request(app.callback())
        .head("/")
        .expect("content-type", /application\/javascript/)
        .expect(200);
    });
  });

  describe("when no middleware is present", () => {
    it("should 404", async () => {
      const app = new Koa();

      await request(app.callback()).get("/").expect(404);
    });
  });

  describe("when res has already been written to", () => {
    it("should not cause an app error", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        const res = ctx.res;
        ctx.status = 200;
        res.setHeader("Content-Type", "text/html");
        res.write("Hello");
      });

      app.on("error", (err) => {
        throw err;
      });

      await request(app.callback()).get("/").expect(200);
    });

    it("should send the right body", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        const res = ctx.res;
        ctx.status = 200;
        res.setHeader("Content-Type", "text/html");
        res.write("Hello");
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            res.end("Goodbye");
            resolve();
          }, 0);
        });
      });

      await request(app.callback()).get("/").expect(200).expect("HelloGoodbye");
    });
  });

  describe("when .body is missing", () => {
    describe("with status=400", () => {
      it("should respond with the associated status message", async () => {
        const app = new Koa();

        app.use(async (ctx) => {
          ctx.status = 400;
        });

        await request(app.callback())
          .get("/")
          .expect(400)
          .expect("Content-Length", "11")
          .expect("Bad Request");
      });
    });

    describe("with status=204", () => {
      it("should respond without a body", async () => {
        const app = new Koa();

        app.use(async (ctx) => {
          ctx.status = 204;
        });

        const res = await request(app.callback())
          .get("/")
          .expect(204)
          .expect("");

        assert.strictEqual(
          Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
          false,
        );
      });
    });

    describe("with status=205", () => {
      it("should respond without a body", async () => {
        const app = new Koa();

        app.use(async (ctx) => {
          ctx.status = 205;
        });

        const res = await request(app.callback())
          .get("/")
          .expect(205)
          .expect("");

        assert.strictEqual(
          Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
          false,
        );
      });
    });

    describe("with status=304", () => {
      it("should respond without a body", async () => {
        const app = new Koa();

        app.use(async (ctx) => {
          ctx.status = 304;
        });

        const res = await request(app.callback())
          .get("/")
          .expect(304)
          .expect("");

        assert.strictEqual(
          Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
          false,
        );
      });
    });

    describe("with custom status=700", () => {
      it("should respond with the associated status message", async () => {
        const app = new Koa();
        (statuses as any).message["700"] = "custom status";

        app.use(async (ctx) => {
          ctx.status = 700;
        });

        const res = await request(app.callback())
          .get("/")
          .expect(700)
          .expect("custom status");

        assert.strictEqual((res as any).res.statusMessage, "custom status");
      });
    });

    describe("with custom statusMessage=ok", () => {
      it("should respond with the custom status message", async () => {
        const app = new Koa();

        app.use(async (ctx) => {
          ctx.status = 200;
          ctx.message = "ok";
        });

        const res = await request(app.callback())
          .get("/")
          .expect(200)
          .expect("ok");

        assert.strictEqual((res as any).res.statusMessage, "ok");
      });
    });

    describe("with custom status without message", () => {
      it("should respond with the status code number", async () => {
        const app = new Koa();

        app.use(async (ctx) => {
          ctx.res.statusCode = 701;
        });

        await request(app.callback()).get("/").expect(701).expect("701");
      });
    });
  });

  describe("when .body is a null", () => {
    it("should respond 204 by default", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.body = null;
      });

      const res = await request(app.callback()).get("/").expect(204).expect("");

      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
        false,
      );
    });

    it("should respond 204 with status=200", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.status = 200;
        ctx.body = null;
      });

      const res = await request(app.callback()).get("/").expect(204).expect("");

      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
        false,
      );
    });

    it("should respond 205 with status=205", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.status = 205;
        ctx.body = null;
      });

      const res = await request(app.callback()).get("/").expect(205).expect("");

      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
        false,
      );
    });

    it("should respond 304 with status=304", async () => {
      const app = new Koa();

      app.use(async (ctx) => {
        ctx.status = 304;
        ctx.body = null;
      });

      const res = await request(app.callback()).get("/").expect(304).expect("");

      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(res.headers, "Content-Type"),
        false,
      );
    });
  });
});
