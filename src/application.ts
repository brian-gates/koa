import { AsyncLocalStorage } from "async_hooks";
import debugModule from "debug";
import { EventEmitter } from "events";
import * as http from "http";
import { HttpError } from "http-errors";
import compose from "koa-compose";
import onFinished from "on-finished";
import statuses from "statuses";
import * as util from "util";
import context from "./context";
import { isStream } from "./is-stream";
import { only } from "./only";
import request from "./request";
import response from "./response";

const debug = debugModule("koa:application");

export interface Request {
  app: Application;
  req: http.IncomingMessage;
  res: http.ServerResponse;
  ctx: Context;
  response: Response;
  originalUrl?: string;
}

export interface Response {
  app: Application;
  req: http.IncomingMessage;
  res: http.ServerResponse;
  ctx: Context;
  request: Request;
  _explicitNullBody?: boolean;
  has(field: string): boolean;
  remove(field: string): void;
  length?: number;
}

// Base interface with minimal required properties
export interface Context {
  app: Application;
  request: Request;
  response: Response;
  req: http.IncomingMessage;
  res: http.ServerResponse;
  originalUrl?: string;
  state?: Record<string, unknown>;
  respond?: boolean;
  method?: string;
  status?: number;
  message?: string;
  body?: string | Buffer | object | null | NodeJS.ReadableStream;
  length?: number;
  type?: string;
  writable?: boolean;
  headerSent?: boolean;
  onerror: (err: Error) => void;
}

// Type for middleware next function
export type Next = () => Promise<void>;

// Type for middleware function
export type Middleware = (ctx: Context, next: Next) => Promise<void>;

class Application extends EventEmitter {
  proxy: boolean;
  subdomainOffset: number;
  proxyIpHeader: string;
  maxIpsCount: number;
  env: string;
  compose: Function;
  keys?: string[];
  middleware: Middleware[];
  context: typeof context;
  request: typeof request;
  response: typeof response;
  ctxStorage?: AsyncLocalStorage<unknown>;
  silent?: boolean;

  /**
   * Initialize a new `Application`.
   */
  constructor(options?: {
    env?: string;
    keys?: string[];
    proxy?: boolean;
    subdomainOffset?: number;
    proxyIpHeader?: string;
    maxIpsCount?: number;
    compose?: Function;
    asyncLocalStorage?: boolean | AsyncLocalStorage<unknown>;
  }) {
    super();
    options = options || {};
    this.proxy = options.proxy || false;
    this.subdomainOffset = options.subdomainOffset || 2;
    this.proxyIpHeader = options.proxyIpHeader || "X-Forwarded-For";
    this.maxIpsCount = options.maxIpsCount || 0;
    this.env = options.env || process.env.NODE_ENV || "development";
    this.compose = options.compose || compose;
    if (options.keys) this.keys = options.keys;
    this.middleware = [];
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
    if (util.inspect.custom) {
      this[util.inspect.custom] = this.inspect;
    }
    if (options.asyncLocalStorage) {
      if (options.asyncLocalStorage instanceof AsyncLocalStorage) {
        this.ctxStorage = options.asyncLocalStorage;
      } else {
        this.ctxStorage = new AsyncLocalStorage();
      }
    }
  }

  /**
   * Shorthand for:
   *
   *    http.createServer(app.callback()).listen(...)
   */
  listen(...args: any[]): http.Server {
    debug("listen");
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  /**
   * Return JSON representation.
   * We only bother showing settings.
   */
  toJSON() {
    return only(this, ["subdomainOffset", "proxy", "env"]);
  }

  /**
   * Inspect implementation.
   */
  inspect() {
    return this.toJSON();
  }

  /**
   * Use the given middleware `fn`.
   *
   * Old-style middleware will be converted.
   */
  use(fn: Middleware): this {
    if (typeof fn !== "function")
      throw new TypeError("middleware must be a function!");
    debug("use %s", fn.name || "-");
    this.middleware.push(fn);
    return this;
  }

  /**
   * Return a request handler callback
   * for node's native http server.
   */
  callback() {
    const fn = this.compose(this.middleware);

    if (!this.listenerCount("error")) this.on("error", this.onerror);

    const handleRequest = (
      req: http.IncomingMessage,
      res: http.ServerResponse,
    ) => {
      const ctx = this.createContext(req, res);
      if (!this.ctxStorage) {
        return this.handleRequest(ctx, fn);
      }
      return this.ctxStorage.run(ctx, async () => {
        return await this.handleRequest(ctx, fn);
      });
    };

    return handleRequest;
  }

  /**
   * Return current context from async local storage
   */
  get currentContext() {
    if (this.ctxStorage) return this.ctxStorage.getStore();
  }

  /**
   * Handle request in callback.
   */
  handleRequest(ctx: Context, fnMiddleware: Function) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = (err: Error) => ctx.onerror(err);
    const handleResponse = () => respond(ctx);
    onFinished(res, onerror);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }

  /**
   * Initialize a new context.
   */
  createContext(req: http.IncomingMessage, res: http.ServerResponse) {
    // Forward declarations to handle circular references
    type KoaResponseType = KoaResponse;
    type KoaContextType = KoaContext;

    // Use proper class instances with constructor parameters
    class KoaRequest {
      app: Application;
      req: http.IncomingMessage;
      res: http.ServerResponse;
      ctx: KoaContextType;
      response: KoaResponseType;
      originalUrl?: string;

      constructor(appInstance: Application) {
        this.app = appInstance;
        // Copy all properties from the prototype
        Object.setPrototypeOf(this, appInstance.request);
      }
    }

    class KoaResponse {
      app: Application;
      req: http.IncomingMessage;
      res: http.ServerResponse;
      ctx: KoaContextType;
      request: KoaRequest;
      _explicitNullBody?: boolean;
      length?: number;

      constructor(appInstance: Application) {
        this.app = appInstance;
        // Copy all properties from the prototype
        Object.setPrototypeOf(this, appInstance.response);
      }

      has(field: string): boolean {
        // This will be overridden by the prototype
        return false;
      }

      remove(field: string): void {
        // This will be overridden by the prototype
      }
    }

    class KoaContext implements Context {
      app: Application;
      request: KoaRequest;
      response: KoaResponse;
      req: http.IncomingMessage;
      res: http.ServerResponse;
      originalUrl: string;
      state: Record<string, unknown> = {};
      respond?: boolean;
      method?: string;
      status?: number;
      message?: string;
      body?: string | Buffer | object | null | NodeJS.ReadableStream;
      length?: number;
      type?: string;
      writable: boolean = true;
      headerSent: boolean = false;

      constructor(appInstance: Application) {
        this.app = appInstance;
        // Copy all properties from the prototype
        Object.setPrototypeOf(this, appInstance.context);
      }

      onerror(err: Error) {
        // This method will be overridden by the prototype
        // but we need it for type compatibility
      }
    }

    // Create instances with 'this'
    const request = new KoaRequest(this);
    const response = new KoaResponse(this);
    const context = new KoaContext(this);

    // Set up circular references
    request.req = response.req = context.req = req;
    request.res = response.res = context.res = res;

    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;

    // Set up context properties
    context.request = request;
    context.response = response;
    context.originalUrl = request.originalUrl = req.url;

    return context;
  }

  /**
   * Default error handler.
   */
  onerror(err: Error | unknown): void {
    // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
    // See https://github.com/koajs/koa/issues/1466
    // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
    const isNativeError =
      Object.prototype.toString.call(err) === "[object Error]" ||
      err instanceof Error;
    if (!isNativeError)
      throw new TypeError(util.format("non-error thrown: %j", err));

    const errorObj = err as Error & { status?: number; expose?: boolean };
    if (errorObj.status === 404 || errorObj.expose) return;
    if (this.silent) return;

    const msg = errorObj.stack || String(errorObj);
    console.error(`\n${msg.replace(/^/gm, "  ")}\n`);
  }

  /**
   * Help TS users comply to CommonJS, ESM, bundler mismatch.
   */
  static get default() {
    return Application;
  }
}

/**
 * Response helper.
 */
function respond(ctx: Context) {
  // allow bypassing koa
  if (ctx.respond === false) return;

  const res = ctx.res;

  if (!ctx.writable) return res.end();

  let body = ctx.body;
  const code = ctx.status;

  // ignore body
  if (statuses.empty[code]) {
    // strip headers
    ctx.body = null;
    return res.end();
  }

  if (ctx.method === "HEAD") {
    if (!res.headersSent && !ctx.response.has("Content-Length")) {
      const { length } = ctx.response;
      if (Number.isInteger(length)) ctx.length = length;
    }
    return res.end();
  }

  // status body
  if (body == null) {
    if (ctx.response._explicitNullBody) {
      ctx.response.remove("Content-Type");
      ctx.response.remove("Transfer-Encoding");
      return res.end();
    }
    if (ctx.req.httpVersionMajor >= 2) {
      body = String(code);
    } else {
      body = ctx.message || String(code);
    }
    if (!res.headersSent) {
      ctx.type = "text";
      ctx.length = Buffer.byteLength(body);
    }
    return res.end(body);
  }

  // responses
  if (Buffer.isBuffer(body)) return res.end(body);
  if (typeof body === "string") return res.end(body);
  if (isStream(body)) {
    // Type guard to ensure body has pipe method
    const streamBody = body as NodeJS.ReadableStream;
    return streamBody.pipe(res);
  }

  // body: json (must be an object at this point)
  const jsonBody = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(jsonBody);
  }
  res.end(jsonBody);
}

export { HttpError };

export default Application;
