export function only(
  obj: { [key: string]: any },
  keys: string[],
): { [key: string]: any } {
  return Object.fromEntries(
    keys.filter((key) => obj[key] != null).map((key) => [key, obj[key]]),
  );
}
