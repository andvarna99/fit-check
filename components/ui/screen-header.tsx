import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ScreenHeaderProps = {
  title: string;
  /** Muted text after the title, e.g. "48 items". */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Top-level tab screen header: large italic title with trailing actions. */
export function ScreenHeader({ title, meta, actions, className }: ScreenHeaderProps) {
  return (
    <header className={cn("fc-header", className)}>
      <div className="fc-header__titles">
        <h1 className="type-title-lg">{title}</h1>
        {meta ? <span className="type-caption">{meta}</span> : null}
      </div>
      {actions ? <div className="fc-header__actions">{actions}</div> : null}
    </header>
  );
}

type BarHeaderProps = {
  /** Text, or a styled node such as a "7 / 30" counter. */
  title: ReactNode;
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
};

/** Pushed-screen header: back/close on the left, centered title, action on the right. */
export function BarHeader({ title, start, end, className }: BarHeaderProps) {
  return (
    <header className={cn("fc-header-bar", className)}>
      <div>{start}</div>
      <h1 className="fc-header-bar__title type-title-sm">{title}</h1>
      <div className="fc-header-bar__end">{end}</div>
    </header>
  );
}
