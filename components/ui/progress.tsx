import { cn } from "@/lib/cn";

type ProgressProps = {
  label: string;
  /** 0–100. Omit for an indeterminate bar. */
  value?: number;
  className?: string;
};

/** Beveled Y2K progress bar. */
export function Progress({ label, value, className }: ProgressProps) {
  const determinate = typeof value === "number";
  const clamped = determinate ? Math.min(100, Math.max(0, value)) : undefined;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={clamped}
      className={cn("fc-progress", !determinate && "fc-progress--indeterminate", className)}
    >
      <span style={determinate ? { width: `${clamped}%` } : undefined} />
    </div>
  );
}
