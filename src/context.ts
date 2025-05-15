/**
 * Module dependencies.
 */

import Cookies from "cookies";
import delegate from "delegates";
import httpAssert from "http-assert";
import createError from "http-errors";
import statuses from "statuses";
import * as util from "util";

const COOKIES = Symbol("context#cookies");

// Custom HttpError type for typed error handling
type HttpError = Error & {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  headers?: Record<string, string>;
  headerSent?: boolean;
};

/**
 * Context prototype.
 */

const proto = {
  inspect(): Record<string, unknown> {
    if (this === proto) return this;
    return this.toJSON();
  },

  toJSON() {
    return {
      request: this.request.toJSON(),
      response: this.response.toJSON(),
      app: this.app.toJSON(),
      originalUrl: this.originalUrl,
      req: "<original node req>",
      res: "<original node res>",
      socket: "<original node socket>",
    };
  },

  assert: httpAssert,

  /**
   * Throw an error with `status` (default 500) and
   * `msg`. Note that these are user-level
   * errors, and the message may be exposed to the client.
   *
   *    this.throw(403)
   *    this.throw(400, 'name required')
   *    this.throw('something exploded')
   *    this.throw(new Error('invalid'))
   *    this.throw(400, new Error('invalid'))
   *
   * See: https://github.com/jshttp/http-errors
   *
   * Note: `status` should only be passed as the first parameter.
   */
  throw(...args: any[]): never {
    throw createError(...args);
  },

  /**
   * Default error handling.
   */
  onerror(err: Error | null): void {
    // don't do anything if there is no error.
    // this allows you to pass `this.onerror`
    // to node-style callbacks.
    if (err == null) return;

    // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
    // See https://github.com/koajs/koa/issues/1466
    // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
    const isNativeError =
      Object.prototype.toString.call(err) === "[object Error]" ||
      err instanceof Error;
    if (!isNativeError)
      err = new Error(util.format("non-error thrown: %j", err));

    // Cast to HttpError for additional properties
    const httpError = err as HttpError;

    let headerSent = false;
    if (this.headerSent || !this.writable) {
      headerSent = httpError.headerSent = true;
    }

    // delegate
    this.app.emit("error", err, this);

    // nothing we can do here other
    // than delegate to the app-level
    // handler and log.
    if (headerSent) {
      return;
    }

    const { res } = this;

    // first unset all headers
    /* istanbul ignore else */
    if (typeof res.getHeaderNames === "function") {
      res.getHeaderNames().forEach((name) => res.removeHeader(name));
    } else {
      res._headers = {}; // Node < 7.7
    }

    // then set those specified
    this.set(httpError.headers || {});

    // force text/plain
    this.type = "text";

    let statusCode = httpError.status || httpError.statusCode;

    // default to 500
    if (typeof statusCode !== "number" || !statuses.message[statusCode])
      statusCode = 500;

    // respond
    const code = statuses.message[statusCode];
    const msg = httpError.expose ? httpError.message : code;
    this.status = httpError.status = statusCode;
    this.length = Buffer.byteLength(msg);
    res.end(msg);
  },

  get cookies() {
    if (!this[COOKIES]) {
      this[COOKIES] = new Cookies(this.req, this.res, {
        keys: this.app.keys,
        secure: this.request.secure,
      });
    }
    return this[COOKIES];
  },

  set cookies(_cookies) {
    this[COOKIES] = _cookies;
  },
};

/* istanbul ignore else */
if (util.inspect.custom) {
  proto[util.inspect.custom] = proto.inspect;
}

/**
 * Response delegation.
 */

delegate(proto, "response")
  .method("attachment")
  .method("redirect")
  .method("remove")
  .method("vary")
  .method("has")
  .method("set")
  .method("append")
  .method("flushHeaders")
  .access("status")
  .access("message")
  .access("body")
  .access("length")
  .access("type")
  .access("lastModified")
  .access("etag")
  .getter("headerSent")
  .getter("writable");

/**
 * Request delegation.
 */

delegate(proto, "request")
  .method("acceptsLanguages")
  .method("acceptsEncodings")
  .method("acceptsCharsets")
  .method("accepts")
  .method("get")
  .method("is")
  .access("querystring")
  .access("idempotent")
  .access("socket")
  .access("search")
  .access("method")
  .access("query")
  .access("path")
  .access("url")
  .access("accept")
  .getter("origin")
  .getter("href")
  .getter("subdomains")
  .getter("protocol")
  .getter("host")
  .getter("hostname")
  .getter("URL")
  .getter("header")
  .getter("headers")
  .getter("secure")
  .getter("stale")
  .getter("fresh")
  .getter("ips")
  .getter("ip");

export default proto;
