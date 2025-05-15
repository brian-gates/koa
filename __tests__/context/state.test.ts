import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import Koa from "../..";

describe("ctx.state", () => {
  it("should provide a ctx.state namespace", async () => {
    const app = new Koa();

    app.use(async (ctx) => {
      assert.deepStrictEqual(ctx.state, {});
    });

    await request(app.callback()).get("/").expect(404);
  });
});
