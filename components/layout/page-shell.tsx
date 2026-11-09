import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  actions?: ReactNode;
  children?: ReactNode;
};

/** Temporary screen scaffold until the UI design lands. */
export function PageShell({ title, actions, children }: PageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions}
      </header>
      {children}
    </div>
  );
}
