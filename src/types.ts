import { IncomingMessage, ServerResponse } from "http";
import type Application from "./application.js";
import request from "./request.js";
import response from "./response.js";

export type Context = {
  app: Application;
  request: typeof request;
  response: typeof response & {
    _explicitNullBody?: boolean;
  };
  req: IncomingMessage;
  res: ServerResponse;
  originalUrl: string;
  state: Record<string, unknown>;
  respond?: boolean;
  method?: string;
  status?: number;
  message?: string;
  body?: any;
  length?: number;
  type?: string;
  writable: boolean;
  headerSent: boolean;

  // Methods
  onerror(err: Error): void;
  toJSON(): Record<string, unknown>;
  inspect(): Record<string, unknown>;
  throw(...args: any[]): never;
  assert(condition: any, ...args: any[]): void;
};

export type Next = () => Promise<void>;
export type Middleware = (ctx: Context, next: Next) => Promise<void>;
