import { Suspense } from "react";

import { Icon, Sparkle } from "@/components/ui/icon";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

async function LoginFormWithNext({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div
        className="safe-top relative flex h-[calc(330px+var(--safe-top))] flex-none flex-col items-center justify-center gap-2.5 rounded-b-[40px]"
        style={{ background: "var(--grad-holo-hero)" }}
      >
        <Icon name="hanger" size={44} className="mt-10 text-lavender-700" />
        <h1 className="type-display-xl">Fit Check</h1>
        <p className="type-callout text-lavender-900">Welcome back. Your closet missed you.</p>
        <Sparkle size={22} className="absolute top-[calc(110px+var(--safe-top))] right-[70px] text-pink-400" />
        <Sparkle size={14} className="absolute top-[calc(196px+var(--safe-top))] left-16 text-white" />
      </div>
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithNext {...props} />
      </Suspense>
    </main>
  );
}
