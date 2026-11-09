export type MatchState = "match" | "clash" | "neutral";

/**
 * Placeholder thresholds from the design handoff (≥ 70 MATCH!, < 50 CLASH,
 * score alone in between). Retune once the recommender exists.
 */
export const MATCH_THRESHOLD = 70;
export const CLASH_THRESHOLD = 50;

export function matchStateForScore(score: number): MatchState {
  if (score >= MATCH_THRESHOLD) return "match";
  if (score < CLASH_THRESHOLD) return "clash";
  return "neutral";
}
