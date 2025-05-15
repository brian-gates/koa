"use strict";

import assert from "node:assert/strict";
import {describe, it} from "node:test";
import request from "supertest";
import Koa from "../..";

describe("app.compose", () => {
  it("should work with default compose ", async () => {
    const app = new Koa();
    const calls: number[] = [];

    app.use(async (ctx, next) => {
      calls.push(1);
      return next().then(() => {
        calls.push(4);
      });
    });

    app.use(async (ctx, next) => {
      calls.push(2);
      return next().then(() => {
        calls.push(3);
      });
    });

    await request(app.callback()).get("/").expect(404);

    assert.deepStrictEqual(calls, [1, 2, 3, 4]);
  });

  it("should work with configurable compose", async () => {
    const calls: number[] = [];
    let count = 0;
    const app = new Koa({
      compose(fns){
        return async (ctx) => {
          const dispatch = async () => {
            count++;
            const fn = fns.shift();
            fn && fn(ctx, dispatch);
          };
          dispatch();
        };
      },
    });

    app.use(async (ctx, next) => {
      calls.push(1);
      await next();
      calls.push(4);
    });
    app.use(async (ctx, next) => {
      calls.push(2);
      await next();
      calls.push(3);
    });

    await request(app.callback()).get("/");

    assert.deepStrictEqual(calls, [1, 2, 3, 4]);
    assert.equal(count, 3);
  });
});
