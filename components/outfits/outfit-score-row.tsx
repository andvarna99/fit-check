import { MatchBadge } from "@/components/ui/match-badge";
import type { Selection } from "@/lib/outfits/slots";
import { comboKey } from "@/lib/recommender/generate";
import type { OutfitScore } from "@/lib/recommender/score";
import { matchStateForScore } from "@/lib/ui/match";

/** MATCH! / Clash badge with the reason, re-popping whenever the outfit changes. */
export function OutfitScoreRow({ score, selection }: { score: OutfitScore; selection: Selection }) {
  const key = `${comboKey(selection)}|${selection.accessories.join(",")}`;
  if (!score.judged) {
    return (
      <p className="px-2 pt-1 type-caption">Tag these pieces with colors, formality and warmth to get a match score.</p>
    );
  }
  return (
    <div className="flex min-h-11 items-center gap-2.5 px-2 pt-1">
      <MatchBadge key={key} state={matchStateForScore(score.score)} score={score.score} className="flex-none" />
      {score.caption ? <span className="min-w-0 type-caption">{score.caption}</span> : null}
    </div>
  );
}
