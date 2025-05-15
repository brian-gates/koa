import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {Duplex, Readable} from "stream";
import createContext from "../../test-helpers/context";

describe("ctx.origin", () => {
  it("should return the origin of url", () => {
    const socket = new Duplex();
    const req = {
      "url": "/users/1?next=/dashboard",
      "headers": {
        "host": "localhost",
        "origin": "http://example.com",
      },
      socket,
      "__proto__": Readable.prototype,
    };
    const ctx = createContext(req) as any;
    assert.strictEqual(ctx.origin, "http://example.com");

    // change it also work
    ctx.url = "/foo/users/1?next=/dashboard";
    assert.strictEqual(ctx.origin, "http://example.com");
  });
});
