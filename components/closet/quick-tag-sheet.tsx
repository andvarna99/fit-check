/* eslint-disable @next/next/no-img-element -- item thumbnails (private or local previews) */
"use client";

import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TagChip } from "@/components/ui/chip";
import { normalizeTags } from "@/lib/closet/item-input";
import type { Category, ColorName, Season } from "@/lib/closet/options";
import { isPatchEmpty, type QuickTagPatch } from "@/lib/closet/quick-tag";

import { TagFields } from "./tag-fields";

type QuickTagSheetProps = {
  open: boolean;
  onClose: () => void;
  thumbs: Array<string | null>;
  /** Persists the patch. Resolve to an error message to keep the sheet open. */
  onApply: (patch: QuickTagPatch) => Promise<string | null>;
};

/** Mounts fresh each time it opens, so no touched fields carry over. */
export function QuickTagSheet(props: QuickTagSheetProps) {
  return props.open ? <QuickTagContent {...props} /> : null;
}

function QuickTagContent({ open, onClose, thumbs, onApply }: QuickTagSheetProps) {
  // Undefined = untouched. Only touched fields go into the patch.
  const [category, setCategory] = useState<Category | undefined>();
  const [colors, setColors] = useState<ColorName[]>([]);
  const [seasons, setSeasons] = useState<Season[] | undefined>();
  const [formality, setFormality] = useState<number | undefined>();
  const [warmth, setWarmth] = useState<number | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const n = thumbs.length;
  const patch: QuickTagPatch = {
    ...(category ? { category } : {}),
    ...(colors.length ? { addColors: colors } : {}),
    ...(seasons ? { seasons } : {}),
    ...(formality ? { formality } : {}),
    ...(warmth ? { warmth } : {}),
    ...(tags.length || tagDraft.trim() ? { addTags: normalizeTags([...tags, tagDraft]) } : {}),
  };

  async function apply() {
    setPending(true);
    setError(null);
    const message = await onApply(patch);
    setPending(false);
    if (message) setError(message);
    else onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => !pending && onClose()}
      title={`Tag ${n} ${n === 1 ? "item" : "items"} at once`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={apply} loading={pending} loadingLabel="Saving..." disabled={isPatchEmpty(patch)}>
            {`Apply to ${n}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="type-caption">Only fields you touch change. The rest stay as they are.</p>
          <div className="flex -space-x-3" aria-hidden>
            {thumbs.slice(0, 3).map((src, i) => (
              <span key={i} className="fc-thumb h-11 w-11 p-1">
                {src ? <img src={src} alt="" /> : null}
              </span>
            ))}
            {n > 3 ? (
              <span className="fc-thumb grid h-11 w-11 place-items-center p-1">
                <span className="type-pixel-sm">+{n - 3}</span>
              </span>
            ) : null}
          </div>
        </div>

        {error ? <Banner tone="error">{error}</Banner> : null}

        <TagFields
          category={category ?? null}
          onCategory={(c) => setCategory(c ?? undefined)}
          colors={colors}
          onColors={setColors}
          colorsHint="· adds to each item"
          seasons={seasons ?? []}
          onSeasons={setSeasons}
          formality={formality ?? null}
          onFormality={(v) => setFormality(v ?? undefined)}
          warmth={warmth ?? null}
          onWarmth={(v) => setWarmth(v ?? undefined)}
        />

        <div className="fc-field">
          <label className="fc-label" htmlFor="quick-tag-input">
            Tags
          </label>
          {tags.length ? (
            <div className="fc-chip-wrap">
              {tags.map((t) => (
                <TagChip key={t} onRemove={() => setTags(tags.filter((x) => x !== t))}>
                  {t}
                </TagChip>
              ))}
            </div>
          ) : null}
          <input
            id="quick-tag-input"
            className="fc-input"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && tagDraft.trim()) {
                e.preventDefault();
                setTags(normalizeTags([...tags, tagDraft]));
                setTagDraft("");
              }
            }}
            placeholder={`Add a tag for all ${n}`}
            enterKeyHint="done"
            autoComplete="off"
          />
        </div>
      </div>
    </BottomSheet>
  );
}
