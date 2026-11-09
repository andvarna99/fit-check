"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button, IconButton } from "@/components/ui/button";
import { Chip, ChipRow } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { ItemCard } from "@/components/ui/item-card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedMulti } from "@/components/ui/segmented";
import { SwatchPicker } from "@/components/ui/swatch-picker";
import { WindowPanel } from "@/components/ui/window-panel";
import { activeFilterCount, EMPTY_FILTERS, filterItems, type ClosetFilters } from "@/lib/closet/filter";
import {
  CATEGORIES,
  CATEGORY_PLURAL,
  categoryLine,
  ITEM_STATUSES,
  SCALE,
  SEASON_LABEL,
  SEASONS,
  STATUS_LABEL,
  type Category,
} from "@/lib/closet/options";
import type { ClosetItem } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";
import { useStoredPreference } from "@/lib/ui/use-stored-preference";

const DENSITY_KEY = "fc:closet-density";
const scaleOptions = SCALE.map((n) => ({ value: n, label: String(n) }));

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function ClosetView({ items, draftCount }: { items: ClosetItem[]; draftCount: number }) {
  const [filters, setFilters] = useState<ClosetFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [density, setDensity] = useStoredPreference(DENSITY_KEY, ["2", "3"] as const, "2");
  const columns = density === "3" ? 3 : 2;

  function toggleDensity() {
    setDensity(columns === 2 ? "3" : "2");
  }

  const visible = useMemo(() => filterItems(items, filters), [items, filters]);
  const filtered = visible.length !== items.length;
  const filterCount = activeFilterCount(filters);

  return (
    <>
      <ScreenHeader
        title="Closet"
        meta={filtered ? `${visible.length} of ${plural(items.length, "item")}` : plural(items.length, "item")}
        actions={
          <IconButton
            icon={columns === 2 ? "grid2" : "grid3"}
            variant="tonal"
            label={`Grid density: ${columns} columns`}
            onClick={toggleDensity}
          />
        }
      />

      <div className="flex flex-col gap-3">
        <div className="gutter">
          <label className="fc-search">
            <Icon name="search" size={20} />
            <input
              type="search"
              placeholder="Search your closet"
              aria-label="Search your closet"
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              enterKeyHint="search"
            />
            {filters.query ? (
              <button type="button" className="fc-iconbtn -mr-3" aria-label="Clear search" onClick={() => setFilters((f) => ({ ...f, query: "" }))}>
                <Icon name="close" size={20} />
              </button>
            ) : null}
          </label>
        </div>

        <ChipRow label="Category">
          <Chip variant="filter" icon="filter" count={filterCount || undefined} selected={filterCount > 0} onClick={() => setFilterOpen(true)}>
            Filter
          </Chip>
          <Chip selected={!filters.category} onClick={() => setFilters((f) => ({ ...f, category: null }))}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={filters.category === c}
              onClick={() => setFilters((f) => ({ ...f, category: f.category === c ? null : (c as Category) }))}
            >
              {CATEGORY_PLURAL[c]}
            </Chip>
          ))}
        </ChipRow>

        {draftCount > 0 ? (
          <div className="gutter">
            <Link href="/closet/drafts" className="fc-banner fc-banner--info">
              <Badge tone="draft">{plural(draftCount, "draft")}</Badge>
              <span className="min-w-0 flex-1">Finish tagging to use them in outfits</span>
              <Icon name="right" size={20} />
            </Link>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="gutter flex flex-col gap-2 pt-4">
            <h2 className="type-title-md">Everything here is a draft</h2>
            <p className="type-body text-ink-muted">
              Finish tagging your drafts and they&apos;ll show up here, ready for outfits.
            </p>
          </div>
        ) : visible.length > 0 ? (
          <ul className={`gutter grid gap-3 ${columns === 3 ? "grid-cols-3 gap-2" : "grid-cols-2"}`}>
            {visible.map((item) => (
              <li key={item.id} className="min-w-0">
                <ItemCard
                  href={`/closet/${item.id}`}
                  name={item.name ?? categoryLine(item.category, item.subcategory)}
                  meta={columns === 2 ? categoryLine(item.category, item.subcategory) : undefined}
                  src={imageSrc(item.thumbUrl ?? item.imageUrl)}
                  status={item.status}
                />
              </li>
            ))}
          </ul>
        ) : (
          <NoResults filters={filters} onClear={() => setFilters(EMPTY_FILTERS)} />
        )}
      </div>

      <Button className="fc-fab" icon="plus" onClick={() => setAddOpen(true)}>
        Add
      </Button>

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} items={items} filters={filters} onApply={setFilters} />
      <AddMenu open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function NoResults({ filters, onClear }: { filters: ClosetFilters; onClear: () => void }) {
  const what = filters.category ? CATEGORY_PLURAL[filters.category].toLowerCase() : "items";
  const n = activeFilterCount(filters);
  const parts = [
    filters.query.trim() ? `called “${filters.query.trim()}”` : null,
    n ? `with your ${plural(n, "filter")}` : null,
  ].filter(Boolean);
  return (
    <div className="gutter flex flex-col gap-4 pt-2">
      <WindowPanel title="Search.exe">
        <div className="flex flex-col items-center gap-2 py-4 text-lavender-300">
          <Icon name="search" size={36} />
          <span className="type-pixel-sm text-ink-muted">0 results</span>
        </div>
      </WindowPanel>
      <div className="flex flex-col gap-1">
        <h2 className="type-title-md">Nothing matches that</h2>
        <p className="type-body text-ink-muted">
          No {what} {parts.join(" ")}. Loosen things up and look again.
        </p>
      </div>
      <div>
        <Button variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  items: ClosetItem[];
  filters: ClosetFilters;
  onApply: (f: ClosetFilters) => void;
};

/** Mounts fresh on each open, so the draft starts from the applied filters. */
function FilterSheet(props: FilterSheetProps) {
  return props.open ? <FilterSheetContent {...props} /> : null;
}

function FilterSheetContent({ open, onClose, items, filters, onApply }: FilterSheetProps) {
  // Edit a draft copy; nothing changes on screen until "Show N items".
  const [draft, setDraft] = useState(filters);

  const resultCount = useMemo(() => filterItems(items, draft).length, [items, draft]);
  const colorCount = draft.colors.length;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filter your closet"
      footer={
        <>
          <Button variant="secondary" onClick={() => setDraft({ ...EMPTY_FILTERS, query: draft.query, category: draft.category })}>
            Clear all
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {`Show ${plural(resultCount, "item")}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <fieldset className="fc-fieldset">
          <legend className="fc-label">
            Color {colorCount ? <span className="fc-label__opt">· {colorCount} selected</span> : null}
          </legend>
          <SwatchPicker label="Color" values={draft.colors} onChange={(colors) => setDraft((d) => ({ ...d, colors }))} />
        </fieldset>
        <fieldset className="fc-fieldset">
          <legend className="fc-label">Season</legend>
          <div className="fc-chip-wrap">
            {SEASONS.map((s) => (
              <Chip
                key={s}
                selected={draft.seasons.includes(s)}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    seasons: d.seasons.includes(s) ? d.seasons.filter((x) => x !== s) : [...d.seasons, s],
                  }))
                }
              >
                {SEASON_LABEL[s]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset className="fc-fieldset">
          <legend className="fc-label">
            Formality <span className="fc-label__opt">· 1 casual to 5 formal</span>
          </legend>
          <SegmentedMulti label="Formality" options={scaleOptions} values={draft.formality} onChange={(formality) => setDraft((d) => ({ ...d, formality }))} />
        </fieldset>
        <fieldset className="fc-fieldset">
          <legend className="fc-label">
            Warmth <span className="fc-label__opt">· 1 light to 5 toasty</span>
          </legend>
          <SegmentedMulti label="Warmth" options={scaleOptions} values={draft.warmth} onChange={(warmth) => setDraft((d) => ({ ...d, warmth }))} />
        </fieldset>
        <fieldset className="fc-fieldset">
          <legend className="fc-label">Status</legend>
          <div className="fc-chip-wrap">
            {ITEM_STATUSES.map((s) => (
              <Chip
                key={s}
                selected={draft.statuses.includes(s)}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    statuses: d.statuses.includes(s) ? d.statuses.filter((x) => x !== s) : [...d.statuses, s],
                  }))
                }
              >
                {STATUS_LABEL[s]}
              </Chip>
            ))}
          </div>
        </fieldset>
      </div>
    </BottomSheet>
  );
}

const ADD_OPTIONS = [
  { href: "/closet/new", icon: "camera", title: "Take photo", caption: "One piece, flat or on a hanger" },
  { href: "/closet/new", icon: "image", title: "Choose from library", caption: "Pick one photo you already have" },
  { href: "/closet/bulk", icon: "images", title: "Bulk upload", caption: "Lots of photos, tag them after" },
] as const;

function AddMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Add to your closet">
      <div className="flex flex-col gap-4">
        <nav aria-label="Ways to add" className="fc-group">
          {ADD_OPTIONS.map((o) => (
            <Link key={o.title} href={o.href} className="fc-li" onClick={onClose}>
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-lavender-100 text-lavender-900">
                  <Icon name={o.icon} size={22} />
                </span>
                <span className="flex flex-col">
                  <span className="type-body-strong">{o.title}</span>
                  <span className="type-caption">{o.caption}</span>
                </span>
              </span>
              <Icon name="right" size={20} className="text-ink-muted" />
            </Link>
          ))}
        </nav>
        <Button variant="secondary" block onClick={onClose}>
          Cancel
        </Button>
      </div>
    </BottomSheet>
  );
}
