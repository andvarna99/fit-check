import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  CATEGORIES,
  ITEM_STATUSES,
  OCCASIONS,
  OUTFIT_SOURCES,
  SEASONS,
  SLOTS,
} from "../closet/constants";

// Single-user app: tables intentionally have no userId column (see docs/PLAN.md, Decisions).

export { CATEGORIES, ITEM_STATUSES, OCCASIONS, OUTFIT_SOURCES, SEASONS, SLOTS };

export const categoryEnum = pgEnum("category", CATEGORIES);
export const seasonEnum = pgEnum("season", SEASONS);
export const itemStatusEnum = pgEnum("item_status", ITEM_STATUSES);
export const occasionEnum = pgEnum("occasion", OCCASIONS);
export const outfitSourceEnum = pgEnum("outfit_source", OUTFIT_SOURCES);
export const slotEnum = pgEnum("slot", SLOTS);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    // Nullable so bulk-uploaded photos can be saved as drafts before tagging.
    category: categoryEnum("category"),
    subcategory: text("subcategory"),
    colors: text("colors").array().notNull().default(sql`'{}'::text[]`),
    pattern: text("pattern"),
    material: text("material"),
    seasons: seasonEnum("seasons").array().notNull().default(sql`'{}'::season[]`),
    // 1 (very casual) to 5 (very formal)
    formality: smallint("formality"),
    // 1 (lightest) to 5 (warmest)
    warmth: smallint("warmth"),
    brand: text("brand"),
    priceCents: integer("price_cents"),
    purchasedOn: date("purchased_on"),
    // Storage keys (not public URLs); photos are served by /api/images/[...key].
    imageUrl: text("image_url"),
    // Unprocessed photo, kept so background removal can be undone.
    originalImageUrl: text("original_image_url"),
    // Small version for grids and pickers.
    thumbUrl: text("thumb_url"),
    status: itemStatusEnum("status").notNull().default("clean"),
    isDraft: boolean("is_draft").notNull().default(true),
    // Soft delete: deleted items leave the closet and saved outfits but stay in wear history.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("items_category_idx").on(t.category),
    index("items_is_draft_idx").on(t.isDraft),
    check("items_formality_range", sql`${t.formality} between 1 and 5`),
    check("items_warmth_range", sql`${t.warmth} between 1 and 5`),
    check("items_price_nonnegative", sql`${t.priceCents} >= 0`),
    // A finished (non-draft) item must have a category.
    check("items_category_required", sql`${t.isDraft} or ${t.category} is not null`),
  ],
);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const itemTags = pgTable(
  "item_tags",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.tagId] })],
);

export const outfits = pgTable("outfits", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  occasion: occasionEnum("occasion"),
  createdBy: outfitSourceEnum("created_by").notNull().default("user"),
  ...timestamps,
});

export const outfitItems = pgTable(
  "outfit_items",
  {
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfits.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    slot: slotEnum("slot").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.outfitId, t.itemId] }),
    index("outfit_items_item_idx").on(t.itemId),
  ],
);

export type WeatherSnapshot = {
  tempC: number;
  highC?: number;
  lowC?: number;
  condition: string;
};

export const wearLogs = pgTable(
  "wear_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Kept when the outfit is deleted so history survives.
    outfitId: uuid("outfit_id").references(() => outfits.id, { onDelete: "set null" }),
    wornOn: date("worn_on").notNull(),
    weather: jsonb("weather").$type<WeatherSnapshot>(),
    rating: smallint("rating"),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    index("wear_logs_worn_on_idx").on(t.wornOn),
    check("wear_logs_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

// Items worn are recorded per log (not only via outfitId) so ad-hoc outfits
// and per-item stats like "times worn" and "last worn" work.
export const wearLogItems = pgTable(
  "wear_log_items",
  {
    wearLogId: uuid("wear_log_id")
      .notNull()
      .references(() => wearLogs.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.wearLogId, t.itemId] }),
    index("wear_log_items_item_idx").on(t.itemId),
  ],
);

export const itemsRelations = relations(items, ({ many }) => ({
  tags: many(itemTags),
  outfitItems: many(outfitItems),
  wearLogItems: many(wearLogItems),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  itemTags: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  item: one(items, { fields: [itemTags.itemId], references: [items.id] }),
  tag: one(tags, { fields: [itemTags.tagId], references: [tags.id] }),
}));

export const outfitsRelations = relations(outfits, ({ many }) => ({
  outfitItems: many(outfitItems),
  wearLogs: many(wearLogs),
}));

export const outfitItemsRelations = relations(outfitItems, ({ one }) => ({
  outfit: one(outfits, { fields: [outfitItems.outfitId], references: [outfits.id] }),
  item: one(items, { fields: [outfitItems.itemId], references: [items.id] }),
}));

export const wearLogsRelations = relations(wearLogs, ({ one, many }) => ({
  outfit: one(outfits, { fields: [wearLogs.outfitId], references: [outfits.id] }),
  items: many(wearLogItems),
}));

export const wearLogItemsRelations = relations(wearLogItems, ({ one }) => ({
  wearLog: one(wearLogs, { fields: [wearLogItems.wearLogId], references: [wearLogs.id] }),
  item: one(items, { fields: [wearLogItems.itemId], references: [items.id] }),
}));

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Outfit = typeof outfits.$inferSelect;
export type WearLog = typeof wearLogs.$inferSelect;
