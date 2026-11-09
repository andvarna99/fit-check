import { CATEGORY_LABEL, type Category, type ItemStatus, type Season } from "./options";

/** Minimal shape the closet grid filters on. */
export type FilterableItem = {
  name: string | null;
  category: Category | null;
  subcategory: string | null;
  colors: string[];
  seasons: Season[];
  formality: number | null;
  warmth: number | null;
  status: ItemStatus;
  brand: string | null;
  material: string | null;
  pattern: string | null;
  tags: string[];
};

export type ClosetFilters = {
  query: string;
  category: Category | null;
  colors: string[];
  seasons: Season[];
  formality: number[];
  warmth: number[];
  statuses: ItemStatus[];
};

export const EMPTY_FILTERS: ClosetFilters = {
  query: "",
  category: null,
  colors: [],
  seasons: [],
  formality: [],
  warmth: [],
  statuses: [],
};

/** Number of active filters shown on the Filter chip (search and category chips excluded). */
export function activeFilterCount(f: ClosetFilters): number {
  return [f.colors, f.seasons, f.formality, f.warmth, f.statuses].filter((group) => group.length > 0).length;
}

function haystack(item: FilterableItem): string {
  return [
    item.name,
    item.category ? CATEGORY_LABEL[item.category] : null,
    item.subcategory,
    item.brand,
    item.material,
    item.pattern,
    ...item.colors,
    ...item.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Within a group, any selected value matches (OR). Across groups, all must match (AND).
 * Items with no value for a filtered scale (e.g. no formality set) are excluded by that filter.
 */
export function filterItems<T extends FilterableItem>(items: T[], f: ClosetFilters): T[] {
  const terms = f.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (f.category && item.category !== f.category) return false;
    if (f.colors.length && !item.colors.some((c) => f.colors.includes(c))) return false;
    if (f.seasons.length && !item.seasons.some((s) => f.seasons.includes(s))) return false;
    if (f.formality.length && (item.formality === null || !f.formality.includes(item.formality))) return false;
    if (f.warmth.length && (item.warmth === null || !f.warmth.includes(item.warmth))) return false;
    if (f.statuses.length && !f.statuses.includes(item.status)) return false;
    if (terms.length) {
      const text = haystack(item);
      if (!terms.every((t) => text.includes(t))) return false;
    }
    return true;
  });
}
