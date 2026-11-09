"use client";

import { cn } from "@/lib/cn";

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

type StarRatingProps = {
  value: number | null;
  /** Tapping the current rating again clears it. */
  onChange: (value: number | null) => void;
  disabled?: boolean;
  className?: string;
};

/** 1–5 star rating (WearSheet / WearEntry). */
export function StarRating({ value, onChange, disabled, className }: StarRatingProps) {
  return (
    <div className={cn("fc-stars", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={cn("fc-star", value !== null && n <= value && "is-on")}
          aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
          aria-pressed={value === n}
          disabled={disabled}
          onClick={() => onChange(value === n ? null : n)}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </div>
  );
}

/** Read-only "4/5" rating label in the pixel font. */
export function RatingLabel({ value, className }: { value: number | null; className?: string }) {
  return (
    <span className={cn("type-pixel-sm", value ? "text-pink-700" : "text-ink-muted", className)}>
      {value ? `${value}/5` : "No rating"}
    </span>
  );
}
