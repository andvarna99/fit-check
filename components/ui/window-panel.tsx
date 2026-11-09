import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Icon } from "./icon";

type WindowPanelProps = {
  /** Pixel-font title bar text, sentence case. */
  title: string;
  /** Plain white title bar instead of holo (loading windows). */
  plain?: boolean;
  onClose?: () => void;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/** Retro late-'90s window. Decorative container: use at most one holo surface per screen. */
export function WindowPanel({ title, plain, onClose, className, bodyClassName, children }: WindowPanelProps) {
  return (
    <section className={cn("fc-window", plain && "fc-window--plain", className)} aria-label={title}>
      <header className="fc-window__bar">
        <span className="fc-window__title" aria-hidden>
          {title}
        </span>
        <span className="fc-window__btns">
          <span className="fc-window__b" aria-hidden />
          <span className="fc-window__b" aria-hidden />
          {onClose ? (
            <button type="button" className="fc-window__b fc-window__x" aria-label="Close" onClick={onClose}>
              <Icon name="close" size={12} />
            </button>
          ) : (
            <span className="fc-window__b" aria-hidden />
          )}
        </span>
      </header>
      <div className={cn("fc-window__body", bodyClassName)}>{children}</div>
    </section>
  );
}
