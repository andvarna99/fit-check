"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";

import { saveOutfit } from "@/app/(flow)/outfits/actions";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Chip, ChipRow } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";
import { TextField } from "@/components/ui/text-field";
import { OCCASIONS } from "@/lib/closet/constants";
import type { ClosetItem } from "@/lib/closet/queries";
import { MAX_OUTFIT_NAME } from "@/lib/outfits/input";
import { OCCASION_LABEL, selectedIds, shuffleSelection, type BuilderRow, type Occasion, type Selection } from "@/lib/outfits/slots";
import { scoreSelection } from "@/lib/recommender/generate";
import { piecesFromCloset } from "@/lib/recommender/pieces";

import { BUILDER_ROWS, DressUpPanel, itemsByRow } from "./dress-up-panel";
import { OutfitScoreRow } from "./outfit-score-row";

export type OutfitBuilderProps = {
  /** Null for a new outfit. */
  outfitId: string | null;
  items: ClosetItem[];
  initial: { name: string; occasion: Occasion | null; selection: Selection };
};

/**
 * E3. The page stays mounted (hidden) after you leave it, so after a save the
 * form remounts with fresh state the next time it's shown.
 */
export function OutfitBuilder(props: OutfitBuilderProps) {
  const [generation, setGeneration] = useState(0);
  const resetWhenHidden = useRef(false);

  useLayoutEffect(() => {
    return () => {
      if (!resetWhenHidden.current) return;
      resetWhenHidden.current = false;
      setGeneration((g) => g + 1);
    };
  }, []);

  return <BuilderForm key={generation} {...props} onSaved={() => (resetWhenHidden.current = true)} />;
}

function BuilderForm({ outfitId, items, initial, onSaved }: OutfitBuilderProps & { onSaved: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [occasion, setOccasion] = useState<Occasion | null>(initial.occasion);
  const [selection, setSelection] = useState<Selection>(initial.selection);
  const [locked, setLocked] = useState<ReadonlySet<BuilderRow>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categoryOf = (id: string) => byId.get(id)?.category ?? undefined;
  const rowItems = useMemo(() => itemsByRow(items), [items]);
  const pieces = useMemo(() => piecesFromCloset(items), [items]);
  const ids = selectedIds(selection, categoryOf);

  // No weather or recency here: a saved outfit is judged on how it looks.
  const score = scoreSelection(selection, pieces, { occasion, weather: null, season: null, today: null });

  function updateSelection(update: (s: Selection) => Selection) {
    setSelection(update);
    setError(null);
  }

  function toggleLock(row: BuilderRow, on: boolean) {
    setLocked((prev) => {
      const next = new Set(prev);
      if (on) next.add(row);
      else next.delete(row);
      return next;
    });
  }

  function shuffle() {
    const options = Object.fromEntries(BUILDER_ROWS.map((r) => [r, rowItems[r].map((i) => i.id)])) as Record<BuilderRow, string[]>;
    updateSelection((s) => shuffleSelection(s, options, locked));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveOutfit(outfitId, { name, occasion, itemIds: ids });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
      router.replace(`/outfits/${result.id}`);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarHeader
        title={outfitId ? "Edit outfit" : "New outfit"}
        start={
          <Link href={outfitId ? `/outfits/${outfitId}` : "/outfits"} className="fc-iconbtn" aria-label="Close builder">
            <Icon name="close" />
          </Link>
        }
      />

      <div className="flex flex-1 flex-col gap-3 pb-4">
        <div className="gutter">
          <TextField
            label="Outfit name"
            optional
            value={name}
            maxLength={MAX_OUTFIT_NAME}
            placeholder="Gallery opening"
            onChange={(e) => setName(e.target.value)}
            enterKeyHint="done"
          />
        </div>

        <ChipRow label="Occasion">
          {OCCASIONS.map((o) => (
            <Chip key={o} selected={occasion === o} onClick={() => setOccasion(occasion === o ? null : o)}>
              {OCCASION_LABEL[o]}
            </Chip>
          ))}
        </ChipRow>

        <div className="gutter">
          <DressUpPanel
            items={items}
            selection={selection}
            onSelectionChange={updateSelection}
            locked={locked}
            onLockedChange={toggleLock}
            header={score ? <OutfitScoreRow score={score} selection={selection} /> : null}
          />
        </div>

        {error ? (
          <div className="gutter">
            <Banner tone="error">{error}</Banner>
          </div>
        ) : null}
      </div>

      <div className="fc-actionbar">
        <Button variant="secondary" icon="shuffle" className="!flex-none" onClick={shuffle} disabled={pending}>
          Shuffle
        </Button>
        <Button onClick={save} loading={pending} loadingLabel="Saving..." disabled={ids.length === 0}>
          Save
        </Button>
      </div>
    </div>
  );
}
