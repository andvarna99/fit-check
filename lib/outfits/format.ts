import { formatDate } from "@/lib/closet/format";

import { OCCASION_LABEL, type Occasion } from "./slots";

/** "Casual · worn 4x", "Never worn". */
export function outfitMeta(outfit: { occasion: Occasion | null; timesWorn: number }): string {
  const worn = outfit.timesWorn === 0 ? "never worn" : `worn ${outfit.timesWorn}x`;
  const text = [outfit.occasion ? OCCASION_LABEL[outfit.occasion] : null, worn].filter(Boolean).join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Worn 4 times · last worn Oct 30", "Not worn yet". */
export function wornSummary(timesWorn: number, lastWornOn: string | null): string {
  if (timesWorn === 0 || !lastWornOn) return "Not worn yet";
  const times = timesWorn === 1 ? "Worn once" : `Worn ${timesWorn} times`;
  return `${times} · last worn ${formatDate(lastWornOn, { year: false })}`;
}
