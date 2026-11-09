import { jwtVerify, SignJWT } from "jose";

// Edge/proxy-safe: no Node-only APIs, so this module can run in proxy.ts.

export const SESSION_COOKIE = "fc_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const ISSUER = "fit-check";
const SUBJECT = "owner";

function getSecretKey(secret = process.env.SESSION_SECRET): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(secret?: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(SUBJECT)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret?: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey(secret), {
      issuer: ISSUER,
      subject: SUBJECT,
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}
