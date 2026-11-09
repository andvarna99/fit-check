import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

async function LoginFormWithNext({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="safe-area mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-6">
      <h1 className="text-center text-3xl font-bold">Fit Check</h1>
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithNext {...props} />
      </Suspense>
    </main>
  );
}
