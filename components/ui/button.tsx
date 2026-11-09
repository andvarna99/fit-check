import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "destructive-outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: IconName;
  block?: boolean;
  size?: "md" | "sm";
  /** Shows `loadingLabel` and disables the button. */
  loading?: boolean;
  /**
   * Sentence case, e.g. "Signing in...". CSS uppercases it. Use three periods,
   * not "…": the Silkscreen pixel font has no ellipsis glyph.
   */
  loadingLabel?: string;
};

/** Labels are written in sentence case; the Silkscreen style uppercases them in CSS. */
export function Button({
  variant = "primary",
  icon,
  block,
  size = "md",
  loading,
  loadingLabel = "Loading...",
  className,
  children,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "fc-btn",
        `fc-btn--${variant}`,
        block && "fc-btn--block",
        size === "sm" && "fc-btn--sm",
        className,
      )}
    >
      {icon && !loading ? <Icon name={icon} size={20} /> : null}
      <span>{loading ? loadingLabel : children}</span>
    </button>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: IconName;
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  variant?: "plain" | "tonal" | "primary";
  /** Toggle state; omit for non-toggle buttons. */
  pressed?: boolean;
};

export function IconButton({
  icon,
  label,
  variant = "plain",
  pressed,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      className={cn("fc-iconbtn", `fc-iconbtn--${variant}`, pressed && "is-pressed", className)}
    >
      <Icon name={icon} />
    </button>
  );
}
