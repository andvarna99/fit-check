import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone = "clean" | "laundry" | "stored" | "draft" | "info";

/** Small pixel-font label. Write children in sentence case; CSS uppercases. */
export function Badge({ tone, className, children }: { tone: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={cn("fc-badge", `fc-badge--${tone}`, className)}>{children}</span>;
}

export type ItemStatus = "clean" | "laundry" | "stored";

const STATUS_LABEL: Record<ItemStatus, string> = {
  clean: "Clean",
  laundry: "Laundry",
  stored: "Stored",
};

export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <Badge tone={status} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
