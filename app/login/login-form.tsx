"use client";

import { useActionState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="gutter flex flex-1 flex-col pt-8" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {/*
        Password-only login. This visually hidden username lets iOS Keychain
        offer to save and autofill the password.
      */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        defaultValue="Fit Check"
        readOnly
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      />

      <div className="flex flex-col gap-4">
        {state.error ? <Banner tone="error">{state.error}</Banner> : null}
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          error={state.fieldError}
        />
      </div>

      <div className="safe-bottom mt-auto flex flex-col gap-2 pt-8 pb-2">
        <Button type="submit" block loading={pending} loadingLabel="Signing in...">
          Sign in
        </Button>
        <p className="type-caption pb-6 text-center">Private closet. Only you can sign in.</p>
      </div>
    </form>
  );
}
