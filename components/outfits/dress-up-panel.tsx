/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
"use client";

import { useMemo, useState, type ReactNode } from "react";

import { DressUpSlot, type SlotItem } from "@/components/ui/dress-up-slot";
import { Icon } from "@/components/ui/icon";
import { WindowPanel } from "@/components/ui/window-panel";
import { categoryLine } from "@/lib/closet/options";
import type { ClosetItem } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";
import { MAX_ACCESSORIES, ROW_CATEGORIES, ROW_LABEL, type BuilderRow, type Selection } from "@/lib/outfits/slots";

import { SlotPickerSheet } from "./slot-picker-sheet";

export const BUILDER_ROWS: BuilderRow[] = ["outerwear", "core", "bottom", "shoes"];

type Picker = BuilderRow | "accessories";

const PICKER_COPY: Record<Picker, { title: string; noun: string }> = {
  outerwear: { title: "Pick outerwear", noun: "outerwear" },
  core: { title: "Pick a top or dress", noun: "tops and dresses" },
  bottom: { title: "Pick a bottom", noun: "bottoms" },
  shoes: { title: "Pick shoes", noun: "shoes" },
  accessories: { title: "Pick accessories", noun: "accessories" },
};

export type RowItems = Record<Picker, ClosetItem[]>;

/** Closet items grouped by builder row. */
export function itemsByRow(items: ClosetItem[]): RowItems {
  const out = {} as RowItems;
  for (const row of BUILDER_ROWS) out[row] = items.filter((i) => i.category && ROW_CATEGORIES[row].includes(i.category));
  out.accessories = items.filter((i) => i.category === "accessory");
  return out;
}

function toSlotItem(item: ClosetItem): SlotItem {
  return { id: item.id, name: item.name ?? categoryLine(item.category, item.subcategory), src: imageSrc(item.thumbUrl ?? item.imageUrl) };
}

type DressUpPanelProps = {
  items: ClosetItem[];
  selection: Selection;
  onSelectionChange: (update: (s: Selection) => Selection) => void;
  locked: ReadonlySet<BuilderRow>;
  onLockedChange: (row: BuilderRow, locked: boolean) => void;
  /** Shown above the slots, e.g. the match badge. */
  header?: ReactNode;
  title?: string;
  className?: string;
};

/** The Dress-up.exe window: one swipeable slot per row, accessories, and a picker sheet. */
export function DressUpPanel({ items, selection, onSelectionChange, locked, onLockedChange, header, title = "Dress-up.exe", className }: DressUpPanelProps) {
  const [picker, setPicker] = useState<Picker | null>(null);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const rowItems = useMemo(() => itemsByRow(items), [items]);
  const categoryOf = (id: string) => byId.get(id)?.category ?? undefined;
  const dressOn = selection.core !== null && categoryOf(selection.core) === "dress";

  const setRow = (row: BuilderRow, id: string | null) => onSelectionChange((s) => ({ ...s, [row]: id }));

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

    const index = Math.max(
      list.findIndex((i) => i.id === current),
      0,
    );
    return (
      <DressUpSlot
        key={row}
        label={label}
        optional={optional}
        items={list.map(toSlotItem)}
        index={index}
        onIndexChange={(_, item) => setRow(row, item.id)}
        locked={locked.has(row)}
        onLockedChange={(on) => onLockedChange(row, on)}
        onOpen={() => setPicker(row)}
      />
    );
  }

  const accessories = selection.accessories.map((id) => byId.get(id)).filter((i): i is ClosetItem => !!i);
  const pickerCopy = picker ? PICKER_COPY[picker] : null;

  return (
    <>
      <WindowPanel title={title} className={className} bodyClassName="flex flex-col gap-2 p-2">
        {header}
        {slotFor("outerwear")}
        {slotFor("core")}
        {dressOn ? <p className="fc-slot__hidden">Bottom hidden while a dress is on</p> : slotFor("bottom")}
        {slotFor("shoes")}

        <div className="flex flex-col gap-2 px-2 pt-1 pb-1">
          <span className="fc-slot__label">
            Accessories <span className="fc-slot__opt">optional</span>
          </span>
          <div className="fc-accessories">
            {accessories.map((a) => {
              const src = imageSrc(a.thumbUrl ?? a.imageUrl);
              return (
                <button key={a.id} type="button" aria-label={`Change accessories, ${a.name ?? categoryLine(a.category, a.subcategory)}`} onClick={() => setPicker("accessories")}>
                  {src ? <img src={src} alt="" /> : <Icon name="hanger" className="text-lavender-300" />}
                </button>
              );
            })}
            {accessories.length < MAX_ACCESSORIES ? (
              <button type="button" className="fc-slot-add" onClick={() => setPicker("accessories")}>
                <Icon name="plus" size={20} />
                Add
              </button>
            ) : null}
          </div>
        </div>
      </WindowPanel>

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
          if (picker === "accessories") onSelectionChange((s) => ({ ...s, accessories: picked.slice(0, MAX_ACCESSORIES) }));
          else if (picker) setRow(picker, picked[0] ?? null);
        }}
      />
    </>
  );
}
