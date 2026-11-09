import { z } from "zod";

import { CATEGORIES, COLOR_NAMES, PATTERNS, SEASONS } from "./options";

export const CATEGORY_REQUIRED_MESSAGE = "Pick a category to save, or save it as a draft.";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const scale = z
  .union([z.literal(""), z.coerce.number().int().min(1).max(5)])
  .nullable()
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

/** "$1,250.50" → 125050. Empty → null. */
export function parsePriceToCents(raw: string | null | undefined): number | null | "invalid" {
  const cleaned = (raw ?? "").replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(cleaned)) return "invalid";
  return Math.round(Number(cleaned) * 100);
}

/** Lowercase, trimmed, de-duplicated tag names. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const tag of tags) {
    const t = tag.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40);
    if (t) seen.add(t);
  }
  return [...seen].slice(0, 20);
}

export const itemInputSchema = z
  .object({
    intent: z.enum(["save", "draft"]),
    name: optionalText(80),
    category: z
      .enum(CATEGORIES)
      .or(z.literal(""))
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    subcategory: optionalText(40),
    colors: z.array(z.enum(COLOR_NAMES as [string, ...string[]])).max(14).default([]),
    pattern: z
      .enum(PATTERNS)
      .or(z.literal(""))
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    material: optionalText(60),
    seasons: z.array(z.enum(SEASONS)).max(4).default([]),
    formality: scale,
    warmth: scale,
    brand: optionalText(60),
    price: z.string().optional().default(""),
    purchasedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .or(z.literal(""))
      .optional()
      .transform((v) => (v ? v : null)),
    tags: z.array(z.string()).max(40).default([]).transform(normalizeTags),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "save" && !data.category) {
      ctx.addIssue({ code: "custom", path: ["category"], message: CATEGORY_REQUIRED_MESSAGE });
    }
    if (parsePriceToCents(data.price) === "invalid") {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a price like 50 or 49.99." });
    }
  })
  .transform(({ price, intent, ...rest }) => ({
    ...rest,
    isDraft: intent === "draft",
    priceCents: parsePriceToCents(price) as number | null,
    colors: [...new Set(rest.colors)],
    seasons: [...new Set(rest.seasons)],
  }));

export type ItemInput = z.output<typeof itemInputSchema>;
export type ItemFieldErrors = Partial<Record<"category" | "price" | "form", string>>;

/** Reads the item form's fields from FormData (multi-value fields use repeated keys). */
export function itemInputFromFormData(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const getAll = (key: string) => formData.getAll(key).filter((v): v is string => typeof v === "string");
  return itemInputSchema.safeParse({
    intent: get("intent"),
    name: get("name"),
    category: get("category"),
    subcategory: get("subcategory"),
    colors: getAll("colors"),
    pattern: get("pattern"),
    material: get("material"),
    seasons: getAll("seasons"),
    formality: get("formality"),
    warmth: get("warmth"),
    brand: get("brand"),
    price: get("price"),
    purchasedOn: get("purchasedOn"),
    tags: getAll("tags"),
  });
}

export function fieldErrorsFrom(error: z.ZodError): ItemFieldErrors {
  const errors: ItemFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "category" || key === "price") errors[key] ??= issue.message;
    else errors.form ??= "Some details didn't look right. Check the form and try again.";
  }
  return errors;
}
