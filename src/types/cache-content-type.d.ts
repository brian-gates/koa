/**
 * Type definitions for cache-content-type
 * See https://github.com/node-modules/cache-content-type
 */

declare module "cache-content-type" {
  /**
   * Create a full Content-Type header given a MIME type or extension and cache the result.
   */
  function getType(type: string): string | false;

  export default getType;
}
