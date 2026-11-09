# Fit Check: Project Plan

A closet inventory and outfit picker app.

## Core idea

1. **Inventory:** catalog every clothing item with a photo and tags, and make it easy to find.
2. **Outfit picker:** suggest outfits from owned items based on weather, occasion, and recent wear history.

All other features build on these two.

## Features

### MVP

- **Add item:** take or upload a photo; set category (top, bottom, outerwear, shoes, accessory, dress), colors, season, formality, and brand.
- **Bulk upload:** select many photos at once for initial closet setup. Items land in a review queue where each can be tagged quickly. Supports selecting several items and applying shared tags in one step (e.g. set category "shoes" on 8 items). Untagged items can be saved as drafts and finished later.
- **Background removal** on item photos (client-side, in the browser) for a clean, catalog-style closet view.
- **Closet grid:** filter by category, color, and season; search.
- **Manual outfit builder:** select items into a saved outfit.
- **"Pick for me":** rule-based outfit suggestions that consider:
  - weather (item warmth score vs. current temperature)
  - formality level (casual / smart casual / formal)
  - color compatibility
  - recency (prefer items not worn recently)
- **Wear log:** record what was worn each day; feeds suggestions and stats.

### V2

- **AI auto-tagging:** a vision model fills in category, colors, material, and season from the photo; the user corrects as needed.
- **AI stylist chat:** natural-language requests, e.g. "Dinner date, 55°F and drizzly, built around my green jacket."
- **Outfit calendar:** plan upcoming outfits and view wear history.
- **Packing lists:** generate a capsule wardrobe from the closet for a trip (destination, dates, weather).
- **Closet stats:** cost per wear, most/least worn items, forgotten items, color breakdown.

### Future ideas

- Declutter queue (items unworn for 6+ months)
- Wishlist and wardrobe gap analysis
- Share an outfit with friends for feedback
- Laundry status, so items in the wash are excluded from suggestions

## Data model

Implemented in `lib/db/schema.ts`. Single user, so there is no `User` table or `userId` column.

```
Item           id, name, category, subcategory, colors[], pattern, material,
               seasons[], formality(1-5), warmth(1-5), brand, priceCents,
               purchasedOn, imageUrl, originalImageUrl,
               status(clean|laundry|stored), isDraft
Tag / ItemTag  free-form tags (many-to-many with Item)
Outfit         id, name, occasion(casual|smart_casual|formal), createdBy(user|rules|ai)
OutfitItem     outfitId, itemId, slot(outerwear|top|dress|bottom|shoes|accessory)
WearLog        id, outfitId?, wornOn, weather snapshot, rating(1-5)?
WearLogItem    wearLogId, itemId
```

- `warmth` and `formality` scores are the primary inputs to the rule-based recommender.
- `isDraft` supports bulk upload: drafts may have no category; finished items must have one (enforced by a check constraint).
- Items worn are stored per wear log (`WearLogItem`) rather than only via `outfitId`, so ad-hoc outfits and per-item stats work, and history survives outfit deletion.

## Stack

| Layer   | Choice                                        | Rationale                                                        |
|---------|-----------------------------------------------|------------------------------------------------------------------|
| App     | Next.js (App Router) + TypeScript, as a PWA   | Single codebase; mobile camera access without an app store       |
| UI      | Tailwind CSS + shadcn/ui                      | Fast iteration with solid defaults                               |
| DB      | Postgres (Neon) + Drizzle ORM; PGlite locally | Relational fit for items/outfits; typed schema and migrations; no local Postgres install needed |
| Images  | Vercel Blob (private)                         | Direct client uploads avoid the 4.5 MB function body limit       |
| Auth    | Single password (`APP_PASSWORD`) + signed session cookie (jose) | Single-user app; no third-party auth service needed |
| Weather | Open-Meteo                                    | Free, no API key                                                 |
| AI (V2) | AI SDK + AI Gateway, vision-capable model     | Auto-tagging and stylist chat                                    |

PWA requirements: web app manifest (name, icons, standalone display mode), a service worker for installability and caching the app shell, mobile-first layouts, and camera/photo-library access via standard file inputs. Primary target is iOS Safari.

Alternative considered: Expo (React Native) for a native iOS app. Rejected for now: it requires a $99/yr Apple Developer account to keep the app installed, and offers little benefit for a single-user app.

## Repository layout

```
fit-check/
├── app/
│   ├── (auth)/                 sign-in pages
│   ├── closet/                 grid, filters, item detail [id]/
│   ├── closet/new/             add-item flow (camera → bg removal → tags)
│   ├── outfits/                saved outfits, builder
│   ├── today/                  "pick for me" + weather card
│   ├── calendar/               wear log / planning (V2)
│   └── api/                    upload tokens, AI endpoints
├── components/
│   ├── ui/                     shadcn primitives
│   ├── closet/                 ItemCard, ItemForm, FilterBar
│   └── outfits/                OutfitCanvas, SlotPicker
├── lib/
│   ├── db/                     schema.ts, queries, migrations/
│   ├── recommender/            outfit engine (pure TypeScript)
│   │   ├── score.ts            color, weather, formality, recency scoring
│   │   ├── colors.ts           color harmony rules
│   │   └── generate.ts         candidate outfits → ranked list
│   ├── weather.ts
│   └── images.ts               background removal, resizing
├── tests/
├── docs/                       plan, decisions, roadmap
└── drizzle.config.ts
```

**Design principle:** `lib/recommender/` contains pure functions with no database or UI dependencies. This keeps it easy to unit-test and tune, and lets the AI layer build on top of it rather than replace it.

## Roadmap

1. **Foundation:** scaffold, DB schema, auth, deploy an empty shell. *Done locally; deployment pending (needs a Vercel project and a Neon database).*
2. **Closet:** add-item flow with photo upload and background removal; grid and filters. *Grid, filters, search, item detail, add/edit/delete and drafts done; background removal and bulk upload in progress.*
3. **Outfits:** manual builder and wear log
4. **Picker:** weather integration and rule-based recommender
5. **AI:** auto-tagging, then stylist chat
6. **Extras:** calendar, packing lists, stats

## Decisions

- **Single user.** No multi-tenancy, sign-up, or account management. Login exists only to keep the deployed app private. `userId` columns may be kept for simplicity but are not required.
- **AI auto-tagging stays in V2.** The MVP uses manual tagging.
- **Bulk upload is in the MVP.** See the Features section.
- **No stack preferences.** The goal is a working, usable app; stack choices are optimized for that.
- **Platform: PWA only.** Installed on iOS via Safari "Add to Home Screen"; no Apple Developer account, App Store review, or native build pipeline required. A native iOS app (Expo) is deferred; revisit only if the app becomes a public, multi-user product, since App Store distribution would also require multi-user support.

- **UI design: Fit Check design system** (handoff in `design/handoff/`, mockups for every MVP view). Implemented as tokens in `app/styles/`, React components in `components/ui/`. Decisions on the handoff's open items:
  - Login is **password only**; the mockup's email field is dropped (a visually hidden username field remains for iOS Keychain autofill).
  - "Needs tags" badge is **pink** (as in the mockups), not the design system's yellow, keeping yellow to one element per screen.
  - App icons use the mark full-bleed (square); iOS and Android apply their own rounded mask.

- **Photos are private.** Stored in private Vercel Blob in production (a local `.data/uploads` folder in development) and served only through the logged-in `/api/images/[...key]` route. Each item stores three versions, all prepared on the device before upload: original, main (≤1600px), and thumbnail (≤480px).
- **Deleting an item is a soft delete.** It leaves the closet and every saved outfit, but the row and photos stay so wear history can still show it.
- **Database driver:** Neon's WebSocket `Pool` driver (not neon-http), because saving an item with its tags uses a transaction.

## Open questions

None currently.
