import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Icon, type IconName } from "./icon";

type BannerProps = {
  tone: "warning" | "error" | "info";
  icon?: IconName;
  className?: string;
  children: ReactNode;
};

const DEFAULT_ICON: Record<BannerProps["tone"], IconName> = {
  warning: "wifiOff",
  error: "alert",
  info: "sparkle",
};

/** Inline message. Errors are announced (role="alert"). */
export function Banner({ tone, icon, className, children }: BannerProps) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("fc-banner", `fc-banner--${tone}`, className)}>
      <Icon name={icon ?? DEFAULT_ICON[tone]} size={20} />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
