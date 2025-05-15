"use strict";

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Duplex, Readable } from "stream";
import request from "supertest";
import Koa from "../../dist/cjs/index.js";
import context from "../../test-helpers/context.js";

describe("ctx.href", () => {
  it("should return the full request url", () => {
    const socket = new Duplex();
    const req = {
      url: "/users/1?next=/dashboard",
      headers: {
        host: "localhost",
      },
      socket,
      __proto__: Readable.prototype,
    };
    const ctx = context(req);
    assert.strictEqual(ctx.href, "http://localhost/users/1?next=/dashboard");
    // change it also work
    ctx.url = "/foo/users/1?next=/dashboard";
    assert.strictEqual(ctx.href, "http://localhost/users/1?next=/dashboard");
  });

  it("should work with `GET http://example.com/foo`", async () => {
    const app = new Koa();
    app.use((ctx) => {
      ctx.body = ctx.href;
    });

    const res = await request(app.callback())
      .get("/foo")
      .set("Host", "example.com")
      .expect(200);

    assert.strictEqual(res.text, "http://example.com/foo");
  });
});
