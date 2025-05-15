import Accept from "accepts";
import { Duplex } from "node:stream";
import { ExtendedRequest, ExtendedResponse, TestContext } from "./types";

/**
 * Type guards for test objects
 */

/**
 * Extended type for a socket with common test properties
 */
export type TestSocket = Duplex & {
  remoteAddress?: string;
};

/**
 * Type guard for TestContext
 */
export function isTestContext(ctx: unknown): ctx is TestContext {
  if (!ctx || typeof ctx !== "object") return false;

  const c = ctx as any;
  return (
    c.request !== undefined &&
    c.response !== undefined &&
    typeof c.onerror === "function"
  );
}

/**
 * Type guard for ExtendedRequest
 */
export function isTestRequest(req: unknown): req is ExtendedRequest {
  if (!req || typeof req !== "object") return false;

  const r = req as any;
  return r.req !== undefined && r.ctx !== undefined && r.headers !== undefined;
}

/**
 * Type guard for ExtendedResponse
 */
export function isTestResponse(res: unknown): res is ExtendedResponse {
  if (!res || typeof res !== "object") return false;

  const r = res as any;
  return (
    (r.res !== undefined &&
      r.ctx !== undefined &&
      typeof r.status === "number") ||
    typeof r.get === "function"
  );
}

/**
 * Type guard for socket with remoteAddress
 */
export function isTestSocket(socket: unknown): socket is TestSocket {
  if (!socket || typeof socket !== "object") return false;

  return socket instanceof Duplex && "remoteAddress" in socket;
}

/**
 * Type guard for object with request properties
 */
export function hasRequestProps<T extends object>(
  obj: T,
): obj is T & {
  headers?: Record<string, string>;
  socket?: TestSocket;
} {
  if (!obj || typeof obj !== "object") return false;

  // Check if it has common request properties
  const hasValidHeaders =
    !("headers" in obj) ||
    (typeof (obj as any).headers === "object" && (obj as any).headers !== null);

  const hasValidSocket =
    !("socket" in obj) ||
    (typeof (obj as any).socket === "object" && (obj as any).socket !== null);

  return hasValidHeaders && hasValidSocket;
}

/**
 * Type guard for Accept instance
 */
export function isAccept(obj: unknown): obj is Accept.Accepts {
  if (!obj || typeof obj !== "object") return false;

  const a = obj as any;
  return (
    typeof a.charset === "function" &&
    typeof a.charsets === "function" &&
    typeof a.encoding === "function" &&
    typeof a.encodings === "function" &&
    typeof a.language === "function" &&
    typeof a.languages === "function" &&
    typeof a.type === "function" &&
    typeof a.types === "function"
  );
}
