import { CATEGORIES, ITEM_STATUSES, SEASONS } from "./constants";

export type Category = (typeof CATEGORIES)[number];
export type Season = (typeof SEASONS)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export { CATEGORIES, ITEM_STATUSES, SEASONS };

export const CATEGORY_LABEL: Record<Category, string> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
};

/** Plural labels for the closet category chips. */
export const CATEGORY_PLURAL: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessories",
};

export const SUBCATEGORIES: Record<Category, readonly string[]> = {
  top: ["Tee", "Tank", "Blouse", "Button-down", "Sweater", "Cardigan", "Sweatshirt", "Bodysuit", "Crop top"],
  bottom: ["Jeans", "Trousers", "Shorts", "Skirt", "Leggings", "Sweatpants"],
  dress: ["Mini", "Midi", "Maxi", "Slip", "Jumpsuit", "Romper"],
  outerwear: ["Jacket", "Coat", "Blazer", "Vest", "Raincoat", "Puffer"],
  shoes: ["Sneaker", "Boot", "Heel", "Flat", "Sandal", "Loafer"],
  accessory: ["Bag", "Belt", "Hat", "Scarf", "Jewelry", "Sunglasses"],
};

/** Palette from the design handoff (FilterSheet / ItemForm). Stored by lowercase name. */
export const COLORS = [
  { name: "black", label: "Black", swatch: "#2b2b33" },
  { name: "white", label: "White", swatch: "#ffffff" },
  { name: "cream", label: "Cream", swatch: "#f2e8d5" },
  { name: "gray", label: "Gray", swatch: "#9aa0a6" },
  { name: "brown", label: "Brown", swatch: "#7a5240" },
  { name: "camel", label: "Camel", swatch: "#c49a6c" },
  { name: "red", label: "Red", swatch: "#c8414b" },
  { name: "pink", label: "Pink", swatch: "#f4a7c4" },
  { name: "lavender", label: "Lavender", swatch: "#c9b6f2" },
  { name: "blue", label: "Blue", swatch: "#6d8fb8" },
  { name: "navy", label: "Navy", swatch: "#2f3e66" },
  { name: "green", label: "Green", swatch: "#a8c3a0" },
  { name: "yellow", label: "Yellow", swatch: "#f3d36b" },
  {
    name: "multi",
    label: "Multi",
    swatch: "conic-gradient(#f4a7c4,#f3d36b,#a8c3a0,#6d8fb8,#c9b6f2,#f4a7c4)",
  },
] as const;

export type ColorName = (typeof COLORS)[number]["name"];
export const COLOR_NAMES = COLORS.map((c) => c.name) as ColorName[];
export const COLOR_BY_NAME = Object.fromEntries(COLORS.map((c) => [c.name, c])) as Record<
  ColorName,
  (typeof COLORS)[number]
>;

export const PATTERNS = ["Solid", "Striped", "Plaid", "Floral", "Polka dot", "Animal print", "Graphic", "Other"] as const;

export const SEASON_LABEL: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  clean: "Clean",
  laundry: "Laundry",
  stored: "Stored",
};

export const SCALE = [1, 2, 3, 4, 5] as const;
export const FORMALITY_ENDS = ["Lounge", "Black tie"] as const;
export const WARMTH_ENDS = ["Breezy", "Toasty"] as const;

/** "Outerwear · Jacket" */
export function categoryLine(category: Category | null, subcategory: string | null): string {
  if (!category) return subcategory ?? "Needs tags";
  return subcategory ? `${CATEGORY_LABEL[category]} · ${subcategory}` : CATEGORY_LABEL[category];
}
