"use client";

import { cn } from "@/lib/cn";

type Option<T> = { value: T; label: string };

type SingleProps<T> = {
  label: string;
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** Tapping the selected option again clears it. */
  allowDeselect?: boolean;
  className?: string;
};

/** One-of-N segmented control (radio semantics). */
export function Segmented<T extends string | number>({ label, options, value, onChange, allowDeselect, className }: SingleProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("fc-seg", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            className="fc-seg__btn"
            onClick={() => onChange(on && allowDeselect ? null : o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

type MultiProps<T> = {
  label: string;
  options: readonly Option<T>[];
  values: readonly T[];
  onChange: (values: T[]) => void;
  className?: string;
};

/** Any-of-N segmented control (toggle buttons), used for filters. */
export function SegmentedMulti<T extends string | number>({ label, options, values, onChange, className }: MultiProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn("fc-seg", className)}>
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            className="fc-seg__btn"
            onClick={() => onChange(on ? values.filter((v) => v !== o.value) : [...values, o.value])}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
