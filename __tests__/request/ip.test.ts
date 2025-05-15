"use strict";

import assert from "node:assert/strict";
import { Duplex } from "node:stream";
import { describe, it } from "node:test";
import Koa from "../..";
import { request as Request } from "../../test-helpers/context";

describe("req.ip", () => {
  describe("with req.ips present", () => {
    it("should return req.ips[0]", () => {
      const app = new Koa();
      const req = { headers: {}, socket: new Duplex() as any };
      app.proxy = true;
      req.headers["x-forwarded-for"] = "127.0.0.1";
      req.socket.remoteAddress = "127.0.0.2";
      const request = Request(req, undefined, app) as any;
      assert.strictEqual(request.ip, "127.0.0.1");
    });
  });

  describe("with no req.ips present", () => {
    it("should return req.socket.remoteAddress", () => {
      const req = { socket: new Duplex() as any };
      req.socket.remoteAddress = "127.0.0.2";
      const request = Request(req) as any;
      assert.strictEqual(request.ip, "127.0.0.2");
    });

    describe("with req.socket.remoteAddress not present", () => {
      it("should return an empty string", () => {
        const socket = new Duplex() as any;
        Object.defineProperty(socket, "remoteAddress", {
          get: () => undefined, // So that the helper doesn't override it with a reasonable value
          set: () => {},
        });
        const request = Request({ socket }) as any;
        assert.strictEqual(request.ip, "");
      });
    });
  });

  it("should be lazy inited and cached", () => {
    const req = { socket: new Duplex() as any };
    req.socket.remoteAddress = "127.0.0.2";
    const request = Request(req) as any;
    assert.strictEqual(request.ip, "127.0.0.2");
    req.socket.remoteAddress = "127.0.0.1";
    assert.strictEqual(request.ip, "127.0.0.2");
  });

  it("should reset ip work", () => {
    const req = { socket: new Duplex() as any };
    req.socket.remoteAddress = "127.0.0.2";
    const request = Request(req) as any;
    assert.strictEqual(request.ip, "127.0.0.2");
    request.ip = "127.0.0.1";
    assert.strictEqual(request.ip, "127.0.0.1");
  });
});
