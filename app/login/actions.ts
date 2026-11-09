"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { checkPassword } from "@/lib/auth/password";
import { endSession, startSession } from "@/lib/auth/server";

export type LoginState = {
  /** Banner message. */
  error?: string;
  /** Message under the password field. */
  fieldError?: string;
};

const loginSchema = z.object({
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

/** Only allow same-origin relative paths, to prevent open redirects. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message ?? "Enter your password." };
  }

  if (!checkPassword(parsed.data.password)) {
    // Slow down repeated guessing.
    await new Promise((resolve) => setTimeout(resolve, 750));
    return {
      error: "That password didn't work. Try again.",
      fieldError: "Check your password and sign in again.",
    };
  }

  await startSession();
  redirect(safeNext(parsed.data.next));
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/login");
}
