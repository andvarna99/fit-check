/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";

import { saveOutfit } from "@/app/(flow)/outfits/actions";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Chip, ChipRow } from "@/components/ui/chip";
import { DressUpSlot, type SlotItem } from "@/components/ui/dress-up-slot";
import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";
import { TextField } from "@/components/ui/text-field";
import { WindowPanel } from "@/components/ui/window-panel";
import { OCCASIONS } from "@/lib/closet/constants";
import { categoryLine } from "@/lib/closet/options";
import type { ClosetItem } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";
import { MAX_OUTFIT_NAME } from "@/lib/outfits/input";
import {
  MAX_ACCESSORIES,
  OCCASION_LABEL,
  ROW_CATEGORIES,
  ROW_LABEL,
  selectedIds,
  shuffleSelection,
  type BuilderRow,
  type Occasion,
  type Selection,
} from "@/lib/outfits/slots";

import { SlotPickerSheet } from "./slot-picker-sheet";

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

type Picker = BuilderRow | "accessories" | null;

const PICKER_COPY: Record<BuilderRow | "accessories", { title: string; noun: string }> = {
  outerwear: { title: "Pick outerwear", noun: "outerwear" },
  core: { title: "Pick a top or dress", noun: "tops and dresses" },
  bottom: { title: "Pick a bottom", noun: "bottoms" },
  shoes: { title: "Pick shoes", noun: "shoes" },
  accessories: { title: "Pick accessories", noun: "accessories" },
};

const ROWS: BuilderRow[] = ["outerwear", "core", "bottom", "shoes"];

function toSlotItem(item: ClosetItem): SlotItem {
  return { id: item.id, name: item.name ?? categoryLine(item.category, item.subcategory), src: imageSrc(item.thumbUrl ?? item.imageUrl) };
}

function BuilderForm({ outfitId, items, initial, onSaved }: OutfitBuilderProps & { onSaved: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [occasion, setOccasion] = useState<Occasion | null>(initial.occasion);
  const [selection, setSelection] = useState<Selection>(initial.selection);
  const [locked, setLocked] = useState<ReadonlySet<BuilderRow>>(new Set());
  const [picker, setPicker] = useState<Picker>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categoryOf = (id: string) => byId.get(id)?.category ?? undefined;

  const rowItems = useMemo(() => {
    const out = {} as Record<BuilderRow | "accessories", ClosetItem[]>;
    for (const row of ROWS) out[row] = items.filter((i) => i.category && ROW_CATEGORIES[row].includes(i.category));
    out.accessories = items.filter((i) => i.category === "accessory");
    return out;
  }, [items]);

  const dressOn = selection.core !== null && categoryOf(selection.core) === "dress";
  const ids = selectedIds(selection, categoryOf);

  function setRow(row: BuilderRow, id: string | null) {
    setSelection((s) => ({ ...s, [row]: id }));
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
    const options = Object.fromEntries(ROWS.map((r) => [r, rowItems[r].map((i) => i.id)])) as Record<BuilderRow, string[]>;
    setSelection((s) => shuffleSelection(s, options, locked));
    setError(null);
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

  function slotFor(row: BuilderRow) {
    const list = rowItems[row];
    const current = selection[row];
    const optional = row === "outerwear";
    const label = row === "core" && current ? (categoryOf(current) === "dress" ? "Dress" : "Top") : ROW_LABEL[row];

    if (optional && current === null) {
      return (
        <button key={row} type="button" className="fc-slot-add" onClick={() => setPicker(row)}>
          <Icon name="plus" size={20} />
          {ROW_LABEL[row]}
          <span className="fc-slot__opt">optional</span>
        </button>
      );
    }

    const slotItems = list.map(toSlotItem);
    const index = Math.max(
      list.findIndex((i) => i.id === current),
      0,
    );
    return (
      <DressUpSlot
        key={row}
        label={label}
        optional={optional}
        items={slotItems}
        index={index}
        onIndexChange={(_, item) => setRow(row, item.id)}
        locked={locked.has(row)}
        onLockedChange={(on) => toggleLock(row, on)}
        onOpen={() => setPicker(row)}
      />
    );
  }

  const accessories = selection.accessories.map((id) => byId.get(id)).filter((i): i is ClosetItem => !!i);
  const pickerCopy = picker ? PICKER_COPY[picker] : null;

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
          <WindowPanel title="Dress-up.exe" bodyClassName="flex flex-col gap-2 p-2">
            {slotFor("outerwear")}
            {slotFor("core")}
            {dressOn ? <p className="fc-slot__hidden">Bottom hidden while a dress is on</p> : slotFor("bottom")}
            {slotFor("shoes")}

            <div className="flex flex-col gap-2 px-2 pt-1 pb-1">
              <span className="fc-slot__label">
                Accessories <span className="fc-slot__opt">optional</span>
              </span>
              <div className="fc-accessories">
                {accessories.map((a) => (
                  <button key={a.id} type="button" aria-label={`Change accessories, ${a.name ?? categoryLine(a.category, a.subcategory)}`} onClick={() => setPicker("accessories")}>
                    {imageSrc(a.thumbUrl ?? a.imageUrl) ? (
                      <img src={imageSrc(a.thumbUrl ?? a.imageUrl) ?? undefined} alt="" />
                    ) : (
                      <Icon name="hanger" className="text-lavender-300" />
                    )}
                  </button>
                ))}
                {accessories.length < MAX_ACCESSORIES ? (
                  <button type="button" className="fc-slot-add" onClick={() => setPicker("accessories")}>
                    <Icon name="plus" size={20} />
                    Add
                  </button>
                ) : null}
              </div>
            </div>
          </WindowPanel>
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

      <SlotPickerSheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={pickerCopy?.title ?? ""}
        noun={pickerCopy?.noun ?? ""}
        items={picker ? rowItems[picker] : []}
        selected={picker === "accessories" ? selection.accessories : picker && selection[picker] ? [selection[picker] as string] : []}
        multiple={picker === "accessories"}
        clearable={picker === "outerwear" || picker === "accessories"}
        onDone={(picked) => {
          if (picker === "accessories") setSelection((s) => ({ ...s, accessories: picked.slice(0, MAX_ACCESSORIES) }));
          else if (picker) setRow(picker, picked[0] ?? null);
        }}
      />
    </div>
  );
}

