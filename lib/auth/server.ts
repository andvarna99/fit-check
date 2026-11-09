import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "./session";

export async function startSession(): Promise<void> {
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Call at the top of every Server Action and data-access function.
 * proxy.ts redirects unauthenticated page loads, but Server Actions and
 * route handlers must verify the session themselves.
 */
export async function requireSession(): Promise<void> {
  const cookieStore = await cookies();
  const ok = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/login");
}
