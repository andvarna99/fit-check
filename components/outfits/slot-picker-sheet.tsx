"use client";

import { useMemo, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ItemCard } from "@/components/ui/item-card";
import { EMPTY_FILTERS, filterItems } from "@/lib/closet/filter";
import { categoryLine } from "@/lib/closet/options";
import type { ClosetItem } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";

type SlotPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  /** e.g. "Pick shoes". */
  title: string;
  /** Noun for the search placeholder, e.g. "shoes". */
  noun: string;
  items: ClosetItem[];
  /** Currently chosen ids. */
  selected: string[];
  /** Pick several (accessories) instead of one. */
  multiple?: boolean;
  /** Optional slots can be emptied. */
  clearable?: boolean;
  onDone: (ids: string[]) => void;
};

/** Mounts fresh on each open, so the choice starts from what the builder has. */
export function SlotPickerSheet(props: SlotPickerSheetProps) {
  return props.open ? <SlotPickerContent {...props} /> : null;
}

function SlotPickerContent({ open, onClose, title, noun, items, selected, multiple, clearable, onDone }: SlotPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>(selected);

  const visible = useMemo(() => filterItems(items, { ...EMPTY_FILTERS, query }), [items, query]);
  const cleanCount = items.filter((i) => i.status === "clean").length;

  function toggle(id: string) {
    if (multiple) setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    else setPicked([id]);
  }

  function finish(ids: string[]) {
    onDone(ids);
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          {clearable ? (
            <Button variant="secondary" onClick={() => finish([])}>
              {multiple ? "Clear all" : "Clear slot"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button disabled={!multiple && picked.length === 0} onClick={() => finish(picked)}>
            {multiple ? "Done" : "Use this"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="type-caption">
            {items.length === 0 ? "None in your closet yet" : `${cleanCount} clean of ${items.length}`}
          </span>
          {multiple && picked.length ? <span className="type-caption">{picked.length} picked</span> : null}
        </div>
        {items.length > 6 ? (
          <label className="fc-search">
            <Icon name="search" size={20} />
            <input
              type="search"
              placeholder={`Search ${noun}`}
              aria-label={`Search ${noun}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
            />
          </label>
        ) : null}
        {items.length === 0 ? (
          <p className="type-body text-ink-muted">Add some {noun} to your closet and they&apos;ll show up here.</p>
        ) : visible.length === 0 ? (
          <p className="type-body text-ink-muted">No {noun} match “{query.trim()}”.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {visible.map((item) => (
              <li key={item.id} className="min-w-0">
                <ItemCard
                  name={item.name ?? categoryLine(item.category, item.subcategory)}
                  src={imageSrc(item.thumbUrl ?? item.imageUrl)}
                  status={item.status}
                  selectable
                  selected={picked.includes(item.id)}
                  onClick={() => toggle(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
