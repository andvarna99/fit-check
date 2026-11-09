import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";

type SelectChipProps = {
  variant?: "select" | "filter";
  selected?: boolean;
  onClick?: () => void;
  icon?: IconName;
  /** CSS color for a leading swatch (color filters). */
  swatch?: string;
  /** Count bubble, e.g. number of active filters. */
  count?: number;
  className?: string;
  children: ReactNode;
};

/** Toggleable chip (category, season, occasion, filters). */
export function Chip({ variant = "select", selected, onClick, icon, swatch, count, className, children }: SelectChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!selected}
      className={cn("fc-chip", `fc-chip--${variant}`, selected && "is-selected", className)}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      {swatch ? <span className="fc-chip__swatch" style={{ background: swatch }} /> : null}
      <span className="fc-chip__label">{children}</span>
      {count ? <span className="fc-chip__count">{count}</span> : null}
    </button>
  );
}

type TagChipProps = {
  children: string;
  onRemove?: () => void;
  className?: string;
};

/** Static tag with an optional remove button (custom item tags). */
export function TagChip({ children, onRemove, className }: TagChipProps) {
  return (
    <span className={cn("fc-chip", "fc-chip--tag", className)}>
      <span className="fc-chip__label">{children}</span>
      {onRemove ? (
        <button type="button" className="fc-chip__x" aria-label={`Remove ${children}`} onClick={onRemove}>
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </span>
  );
}

/** Horizontally scrolling chip row with screen gutters. */
export function ChipRow({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cn("fc-chips", className)}>
      {children}
    </div>
  );
}
