import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of a submitted password against APP_PASSWORD.
 * Both values are hashed first so differing lengths don't leak via timing.
 */
export function checkPassword(
  submitted: string,
  expected: string | undefined = process.env.APP_PASSWORD,
): boolean {
  if (!expected) {
    throw new Error("APP_PASSWORD must be set.");
  }
  const a = createHash("sha256").update(submitted).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
