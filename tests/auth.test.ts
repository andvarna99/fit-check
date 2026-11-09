import { describe, expect, it } from "vitest";

import { checkPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const OTHER_SECRET = "another-secret-that-is-at-least-32-characters";

describe("checkPassword", () => {
  it("accepts the correct password", () => {
    expect(checkPassword("hunter2", "hunter2")).toBe(true);
  });

  it("rejects a wrong password, including different lengths", () => {
    expect(checkPassword("hunter3", "hunter2")).toBe(false);
    expect(checkPassword("hunter", "hunter2")).toBe(false);
    expect(checkPassword("", "hunter2")).toBe(false);
  });

  it("throws when no password is configured", () => {
    expect(() => checkPassword("anything", "")).toThrow(/APP_PASSWORD/);
  });
});

describe("session tokens", () => {
  it("verifies a token signed with the same secret", async () => {
    const token = await createSessionToken(SECRET);
    await expect(verifySessionToken(token, SECRET)).resolves.toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(OTHER_SECRET);
    await expect(verifySessionToken(token, SECRET)).resolves.toBe(false);
  });

  it("rejects missing and malformed tokens", async () => {
    await expect(verifySessionToken(undefined, SECRET)).resolves.toBe(false);
    await expect(verifySessionToken("not-a-jwt", SECRET)).resolves.toBe(false);
  });

  it("rejects an unsigned (alg: none) token", async () => {
    const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
    const forged = `${encode({ alg: "none" })}.${encode({ iss: "fit-check", sub: "owner" })}.`;
    await expect(verifySessionToken(forged, SECRET)).resolves.toBe(false);
  });

  it("requires a sufficiently long secret", async () => {
    await expect(createSessionToken("short")).rejects.toThrow(/SESSION_SECRET/);
  });
});
