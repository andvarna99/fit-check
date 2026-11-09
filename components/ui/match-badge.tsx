import { cn } from "@/lib/cn";
import type { MatchState } from "@/lib/ui/match";

import { Sparkle } from "./icon";

type MatchBadgeProps = {
  state: MatchState | "thinking";
  /** 0–100. Shown next to the label, or alone in the neutral state. */
  score?: number;
  className?: string;
};

const LABEL = { match: "Match!", clash: "Clash", thinking: "Thinking...", neutral: "" } as const;

/** Re-mount with a new `key` when the outfit changes to replay the pop animation. */
export function MatchBadge({ state, score, className }: MatchBadgeProps) {
  const showScore = typeof score === "number" && state !== "thinking";
  return (
    <div
      className={cn("fc-match", state !== "neutral" && `fc-match--${state}`, className)}
      role="status"
      aria-live="polite"
    >
      {state === "match" ? <Sparkle size={14} className="fc-match__s1" /> : null}
      {state !== "neutral" ? <span className="fc-match__text">{LABEL[state]}</span> : null}
      {showScore ? (
        <span className="fc-match__score">
          {Math.round(score)}%<span className="sr-only"> match score</span>
        </span>
      ) : null}
      {state === "match" ? <Sparkle size={10} className="fc-match__s2" /> : null}
    </div>
  );
}
