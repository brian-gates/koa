/**
 * Extended type definitions for Koa that include delegated methods
 */
import { Accepts } from "accepts";
import { IncomingMessage, ServerResponse } from "http";
import Application from "../src/application";
import { Context as BaseContext } from "../src/types";

// Extended request type with all delegated properties and methods
export type ExtendedRequest = {
  app: Application;
  req: IncomingMessage;
  res: ServerResponse;
  ctx: BaseContext;
  response: any;
  originalUrl: string;

  // Request state and properties
  header: Record<string, string>;
  headers: Record<string, string>;
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  querystring: string;
  search: string;
  host: string;
  hostname: string;
  fresh: boolean;
  stale: boolean;
  idempotent: boolean;
  socket: any;
  protocol: string;
  secure: boolean;
  ip: string;
  ips: string[];
  subdomains: string[];
  accept: Accepts;
  origin: string;
  href: string;
  charset: string;

  // Request methods
  acceptsLanguages(...langs: string[]): string | string[] | false;
  acceptsEncodings(...encodings: string[]): string | string[] | false;
  acceptsCharsets(...charsets: string[]): string | string[] | false;
  accepts(...types: string[]): string | string[] | false;
  get(field: string): string | undefined;
  is(...types: string[]): string | false | null;
};

// Extended response type with all delegated properties and methods
export type ExtendedResponse = {
  app: Application;
  req: IncomingMessage;
  res: ServerResponse;
  ctx: BaseContext;
  request: any;

  // Response state and properties
  status: number;
  message: string;
  body: any;
  length: number;
  type: string;
  headerSent: boolean;
  writable: boolean;
  etag: string;
  lastModified: Date;
  header: Record<string, string>;
  headers: Record<string, string>;

  // Response methods
  attachment(filename?: string): void;
  redirect(url: string, alt?: string): void;
  remove(field: string): void;
  vary(field: string): void;
  has(field: string): boolean;
  set(field: string | Record<string, string>, val?: string): void;
  append(field: string, val: string | string[]): void;
  flushHeaders(): void;
  get(field: string): string | undefined;
  is(): false | string;
  is(type: string): false | string;
  is(types: string[]): false | string;
  is(...types: string[]): false | string;
};

// Fully typed Context that includes all delegated methods and properties
export type TestContext = BaseContext & {
  // Properties from request and response
  request: ExtendedRequest;
  response: ExtendedResponse;

  // Delegated from response
  status: number;
  message: string;
  body: any;
  length: number;
  type: string;
  headerSent: boolean;
  writable: boolean;
  etag: string;
  lastModified: Date;

  // Additional properties used in tests
  header: Record<string, string>;
  accept: Accepts;

  // Delegated methods from response
  attachment(filename?: string): void;
  redirect(url: string, alt?: string): void;
  remove(field: string): void;
  vary(field: string): void;
  has(field: string): boolean;
  set(field: string | Record<string, string>, val?: string): void;
  append(field: string, val: string | string[]): void;
  flushHeaders(): void;

  // Delegated methods from request
  acceptsLanguages(...langs: string[]): string | string[] | false;
  acceptsEncodings(...encodings: string[]): string | string[] | false;
  acceptsCharsets(...charsets: string[]): string | string[] | false;
  accepts(...types: string[]): string | string[] | false;
  get(field: string): string | undefined;
  is(): false | string;
  is(type: string): false | string;
  is(types: string[]): false | string;
  is(...types: string[]): false | string;
};

/**
 * Helper function to safely access the extended context functionality
 * without multiple type assertions throughout the codebase
 */
export function asTestContext(ctx: BaseContext): TestContext {
  return ctx as TestContext;
}

/**
 * Helper to correctly type response object for tests
 */
export function asTestResponse(response: any): ExtendedResponse {
  return response as ExtendedResponse;
}

/**
 * Helper to correctly type request object for tests
 */
export function asTestRequest(request: any): ExtendedRequest {
  return request as ExtendedRequest;
}
