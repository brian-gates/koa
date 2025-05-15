/**
 * Module dependencies.
 */

import accepts, { Accepts } from "accepts";
import contentType from "content-type";
import { IncomingMessage } from "http";
import * as net from "net";
import parse from "parseurl";
import { URL, format as stringify } from "url";
import { parse as parseSearchParams } from "./search-params";

import fresh from "fresh";
import typeis from "type-is";
import * as util from "util";
import only from "./only";

const IP = Symbol("context#ip");

/**
 * Request class with all properties and methods
 */
class Request {
  req: IncomingMessage;
  app: {
    proxy: boolean;
    proxyIpHeader: string;
    maxIpsCount: number;
    subdomainOffset: number;
  };
  originalUrl: string;
  ctx: {
    status: number;
  };
  response: {
    header: Record<string, string | string[]>;
  };
  _querycache: Record<string, any>;
  _accept: Accepts;
  memoizedURL: URL | Record<string, any>;
  [IP]: string;

  /**
   * Return request header.
   */
  get header() {
    return this.req.headers;
  }

  /**
   * Set request header.
   */
  set header(val: Record<string, string | string[]>) {
    this.req.headers = val;
  }

  /**
   * Return request header, alias as request.header
   */
  get headers() {
    return this.req.headers;
  }

  /**
   * Set request header, alias as request.header
   */
  set headers(val) {
    this.req.headers = val;
  }

  /**
   * Get request URL.
   */
  get url() {
    return this.req.url;
  }

  /**
   * Set request URL.
   */
  set url(val: string) {
    this.req.url = val;
  }

  /**
   * Get the origin header.
   */
  get origin() {
    return this.req.headers.origin;
  }

  /**
   * Get full request URL.
   */
  get href() {
    // support: `GET http://example.com/foo`
    if (/^https?:\/\//i.test(this.originalUrl)) return this.originalUrl;
    return this.protocol + "://" + this.host + this.originalUrl;
  }

  /**
   * Get request method.
   */
  get method() {
    return this.req.method;
  }

  /**
   * Set request method.
   */
  set method(val: string) {
    this.req.method = val;
  }

  /**
   * Get request pathname.
   */
  get path() {
    return parse(this.req).pathname;
  }

  /**
   * Set pathname, retaining the query string when present.
   */
  set path(path: string) {
    const url = parse(this.req);
    if (url.pathname === path) return;

    url.pathname = path;
    url.path = null;

    this.url = stringify(url);
  }

  /**
   * Get parsed query string.
   */
  get query() {
    const str = this.querystring;
    const c = (this._querycache = this._querycache || {});
    return c[str] || (c[str] = parseSearchParams(str));
  }

  /**
   * Set query string as an object.
   */
  set query(obj: Record<string, any>) {
    this.querystring = stringify(obj);
  }

  /**
   * Get query string.
   */
  get querystring() {
    if (!this.req) return "";
    return parse(this.req).query || "";
  }

  /**
   * Set query string.
   */
  set querystring(str) {
    const url = parse(this.req);
    if (url.search === `?${str}`) return;

    url.search = str;
    url.path = null;
    this.url = stringify(url);
  }

  /**
   * Get the search string. Same as the query string
   * except it includes the leading ?.
   */
  get search() {
    if (!this.querystring) return "";
    return `?${this.querystring}`;
  }

  /**
   * Set the search string. Same as
   * request.querystring= but included for ubiquity.
   */
  set search(str) {
    this.querystring = str;
  }

  /**
   * Parse the "Host" header field host
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   */
  get host() {
    const proxy = this.app.proxy;
    let host = proxy && this.get("X-Forwarded-Host");
    if (!host) {
      if (this.req.httpVersionMajor >= 2) host = this.get(":authority");
      if (!host) host = this.get("Host");
    }
    if (!host) return "";
    return splitCommaSeparatedValues(host, 1)[0];
  }

  /**
   * Parse the "Host" header field hostname
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   */
  get hostname(): string {
    const host = this.host;
    if (!host) return "";
    if (host[0] === "[") return this.URL.hostname || ""; // IPv6
    return host.split(":", 1)[0];
  }

  /**
   * Get WHATWG parsed URL.
   * Lazily memoized.
   */
  get URL() {
    /* istanbul ignore else */
    if (!this.memoizedURL) {
      const originalUrl = this.originalUrl || ""; // avoid undefined in template string
      try {
        this.memoizedURL = new URL(
          `${this.protocol}://${this.host}${originalUrl}`,
        );
      } catch (err) {
        this.memoizedURL = Object.create(null);
      }
    }
    return this.memoizedURL;
  }

  /**
   * Check if the request is fresh, aka
   * Last-Modified and/or the ETag
   * still match.
   */
  get fresh() {
    const method = this.method;
    const s = this.ctx.status;

    // GET or HEAD for weak freshness validation only
    if (method !== "GET" && method !== "HEAD") return false;

    // 2xx or 304 as per rfc2616 14.26
    if ((s >= 200 && s < 300) || s === 304) {
      return fresh(this.header, this.response.header);
    }

    return false;
  }

  /**
   * Check if the request is stale, aka
   * "Last-Modified" and / or the "ETag" for the
   * resource has changed.
   */
  get stale() {
    return !this.fresh;
  }

  /**
   * Check if the request is idempotent.
   */
  get idempotent() {
    const methods = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"];
    return !!~methods.indexOf(this.method);
  }

  /**
   * Return the request socket.
   */
  get socket() {
    return this.req.socket;
  }

  /**
   * Get the charset when present or undefined.
   */
  get charset() {
    try {
      const { parameters } = contentType.parse(this.req);
      return parameters.charset || "";
    } catch (e) {
      return "";
    }
  }

  /**
   * Return parsed Content-Length when present.
   */
  get length() {
    const len = this.get("Content-Length");
    if (len === "") return;
    return ~~len;
  }

  /**
   * Return the protocol string "http" or "https"
   * when requested with TLS. When the proxy setting
   * is enabled the "X-Forwarded-Proto" header
   * field will be trusted. If you're running behind
   * a reverse proxy that supplies https for you this
   * may be enabled.
   */
  get protocol() {
    // Check for encrypted connection by safely accessing socket property
    if (this.socket && "encrypted" in this.socket && this.socket.encrypted)
      return "https";
    if (!this.app.proxy) return "http";
    const proto = this.get("X-Forwarded-Proto");
    return proto ? splitCommaSeparatedValues(proto, 1)[0] : "http";
  }

  /**
   * Shorthand for:
   *
   *    this.protocol == 'https'
   */
  get secure() {
    return this.protocol === "https";
  }

  /**
   * When `app.proxy` is `true`, parse
   * the "X-Forwarded-For" ip address list.
   *
   * For example if the value was "client, proxy1, proxy2"
   * you would receive the array `["client", "proxy1", "proxy2"]`
   * where "proxy2" is the furthest down-stream.
   */
  get ips() {
    const proxy = this.app.proxy;
    const val = this.get(this.app.proxyIpHeader);
    let ips = proxy && val ? splitCommaSeparatedValues(val, Infinity) : [];
    if (this.app.maxIpsCount > 0) {
      ips = ips.slice(-this.app.maxIpsCount);
    }
    return ips;
  }

  /**
   * Return request's remote address
   * When `app.proxy` is `true`, parse
   * the "X-Forwarded-For" ip address list and return the first one
   */
  get ip() {
    if (!this[IP]) {
      this[IP] = this.ips[0] || this.socket.remoteAddress || "";
    }
    return this[IP];
  }

  set ip(_ip) {
    this[IP] = _ip;
  }

  /**
   * Return subdomains as an array.
   *
   * Subdomains are the dot-separated parts of the host before the main domain
   * of the app. By default, the domain of the app is assumed to be the last two
   * parts of the host. This can be changed by setting `app.subdomainOffset`.
   *
   * For example, if the domain is "tobi.ferrets.example.com":
   * If `app.subdomainOffset` is not set, this.subdomains is
   * `["ferrets", "tobi"]`.
   * If `app.subdomainOffset` is 3, this.subdomains is `["tobi"]`.
   */
  get subdomains() {
    const offset = this.app.subdomainOffset;
    const hostname = this.hostname;
    if (net.isIP(hostname)) return [];
    return hostname.split(".").reverse().slice(offset);
  }

  /**
   * Get accept object.
   * Lazily memoized.
   */
  get accept() {
    return this._accept || (this._accept = accepts(this.req));
  }

  /**
   * Set accept object.
   */
  set accept(obj: Accepts) {
    this._accept = obj;
  }

  /**
   * Check if the given `type(s)` is acceptable, returning
   * the best match when true, otherwise `false`, in which
   * case you should respond with 406 "Not Acceptable".
   *
   * The `type` value may be a single mime type string
   * such as "application/json", the extension name
   * such as "json" or an array `["json", "html", "text/plain"]`. When a list
   * or array is given the _best_ match, if any is returned.
   *
   * Examples:
   *
   *     // Accept: text/html
   *     this.accepts('html');
   *     // => "html"
   *
   *     // Accept: text/*, application/json
   *     this.accepts('html');
   *     // => "html"
   *     this.accepts('text/html');
   *     // => "text/html"
   *     this.accepts('json', 'text');
   *     // => "json"
   *     this.accepts('application/json');
   *     // => "application/json"
   *
   *     // Accept: text/*, application/json
   *     this.accepts('image/png');
   *     this.accepts('png');
   *     // => false
   *
   *     // Accept: text/*;q=.5, application/json
   *     this.accepts(['html', 'json']);
   *     this.accepts('html', 'json');
   *     // => "json"
   */
  accepts(...args: string[]) {
    return this.accept.types(...args);
  }

  /**
   * Return accepted encodings or best fit based on `encodings`.
   *
   * Given `Accept-Encoding: gzip, deflate`
   * an array sorted by quality is returned:
   *
   *     ['gzip', 'deflate']
   */
  acceptsEncodings(...args: string[]) {
    return this.accept.encodings(...args);
  }

  /**
   * Return accepted charsets or best fit based on `charsets`.
   *
   * Given `Accept-Charset: utf-8, iso-8859-1;q=0.2, utf-7;q=0.5`
   * an array sorted by quality is returned:
   *
   *     ['utf-8', 'utf-7', 'iso-8859-1']
   */
  acceptsCharsets(...args: string[]) {
    return this.accept.charsets(...args);
  }

  /**
   * Return accepted languages or best fit based on `langs`.
   *
   * Given `Accept-Language: en;q=0.8, es, pt`
   * an array sorted by quality is returned:
   *
   *     ['es', 'pt', 'en']
   */
  acceptsLanguages(...args: string[]) {
    return this.accept.languages(...args);
  }

  /**
   * Check if the incoming request contains the "Content-Type"
   * header field and if it contains any of the given mime `type`s.
   * If there is no request body, `null` is returned.
   * If there is no content type, `false` is returned.
   * Otherwise, it returns the first `type` that matches.
   *
   * Examples:
   *
   *     // With Content-Type: text/html; charset=utf-8
   *     this.is('html'); // => 'html'
   *     this.is('text/html'); // => 'text/html'
   *     this.is('text/*', 'application/json'); // => 'text/html'
   *
   *     // When Content-Type is application/json
   *     this.is('json', 'urlencoded'); // => 'json'
   *     this.is('application/json'); // => 'application/json'
   *     this.is('html', 'application/*'); // => 'application/json'
   *
   *     this.is('html'); // => false
   */
  is(type, ...types) {
    return typeis(this.req, type, ...types);
  }

  /**
   * Return the request mime type void of
   * parameters such as "charset".
   */
  get type() {
    const type = this.get("Content-Type");
    if (!type) return "";
    return type.split(";")[0];
  }

  /**
   * Return request header.
   *
   * The `Referrer` header field is special-cased,
   * both `Referrer` and `Referer` are interchangeable.
   *
   * Examples:
   *
   *     this.get('Content-Type');
   *     // => "text/plain"
   *
   *     this.get('content-type');
   *     // => "text/plain"
   *
   *     this.get('Something');
   *     // => ''
   */
  get(field: string) {
    const req = this.req;
    const headerField = field.toLowerCase();

    switch (headerField) {
      case "referer":
      case "referrer": {
        const ref = req.headers.referrer || req.headers.referer;
        return ref ? ref.toString() : "";
      }
      default: {
        const value = req.headers[headerField];
        if (!value) return "";
        return Array.isArray(value) ? value[0] : value;
      }
    }
  }

  /**
   * Inspect implementation.
   */
  inspect() {
    if (!this.req) return;
    return this.toJSON();
  }

  /**
   * Return JSON representation.
   */
  toJSON() {
    return only(this, ["method", "url", "header"]);
  }
}

/**
 * Split a comma-separated value string into an array of values, with an optional limit.
 * All the values are trimmed of whitespace.
 */
function splitCommaSeparatedValues(value: string, limit?: number) {
  return value.split(",", limit ?? Infinity).map((v) => v.trim());
}

// Add custom inspection implementation for newer Node.js versions
if (util.inspect.custom) {
  Object.defineProperty(Request.prototype, util.inspect.custom, {
    enumerable: false,
    value: function () {
      return this.inspect();
    },
  });
}

export default Request;
