// Dependency-free so client components can import them without pulling in the ORM.
// lib/db/schema.ts builds its Postgres enums from these.

export const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"] as const;
export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export const ITEM_STATUSES = ["clean", "laundry", "stored"] as const;
export const OCCASIONS = ["casual", "smart_casual", "formal"] as const;
export const OUTFIT_SOURCES = ["user", "rules", "ai"] as const;
export const SLOTS = ["outerwear", "top", "dress", "bottom", "shoes", "accessory"] as const;
