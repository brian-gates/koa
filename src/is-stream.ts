import { Stream } from "stream";

export function isStream(stream: unknown): stream is NodeJS.ReadableStream {
  return (
    stream instanceof Stream ||
    (stream !== null &&
      typeof stream === "object" &&
      stream !== null &&
      "readable" in stream &&
      "pipe" in stream &&
      typeof (stream as any).pipe === "function" &&
      "read" in stream &&
      typeof (stream as any).read === "function" &&
      "readable" in stream &&
      typeof (stream as any).readable === "boolean")
  );
}
