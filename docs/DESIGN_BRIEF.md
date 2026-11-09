# Fit Check: Mobile UI Design Brief

Handoff brief for UI design. Covers every MVP view on mobile. See `docs/PLAN.md` for full product context.

## Product summary

Fit Check is a personal (single-user) closet inventory and outfit picker. The user photographs their clothes to build a digital closet, then gets outfit suggestions based on weather, occasion, and what they have worn recently. It ships as a PWA installed to the iPhone home screen, so it runs full-screen with no browser chrome.

## Scope

- **Mobile only.** Design at 390 × 844 (iPhone 14/15/16). Tablet and desktop are out of scope for now.
- **MVP views only.** Future views are listed at the end for awareness; designing them is optional.
- **Light mode only** for now.
- **No AI features in the MVP.** All tagging is manual, so tagging must be fast and low-effort.

## Visual direction: Y2K digital closet

The core inspiration is the computerized closet from the 1995 film *Clueless*: a screen where you click through tops and bottoms on a virtual model and the computer tells you whether the pieces match. Translate that feeling (playful, glamorous, slightly retro-futuristic tech) into a modern, usable mobile app.

**Evoke the aesthetic; do not replicate the film.** The UI must not use the movie's title, character names, quotes, logos, stills, or recreations of the film's screen. The design should be original.

### Mood

- Late-'90s / early-2000s computer interfaces: beveled buttons, window title bars, chunky scrollbars, cursor and pixel motifs, used as accents rather than everywhere
- Y2K gloss: chrome and metallic text, iridescent and holographic gradients, glossy "jelly" buttons, soft drop shadows, sparkles and starbursts
- Fashion: plaid patterns (yellow plaid especially) used sparingly as accent textures, plus fuzzy/marabou-inspired softness
- Overall tone: fun, confident, girly, a little over-the-top, but clean enough for daily use

### Palette suggestions

- Bubblegum and baby pink, lavender, baby blue, mint
- Accents: chrome silver, iridescent gradients, a pop of plaid yellow
- Neutral base (white or very light pastel) so clothing photos stay the focus

### Typography suggestions

- Display: a bubbly, rounded, or chrome-style Y2K display face for headers and the logo
- Accent: a pixel or bitmap-style font for small "system" labels (e.g. `LOADING...`, `MATCH!`)
- Body: a clean, highly legible sans-serif for forms, lists, and tags

### Usability guardrails

- Clothing photos are the hero content; decoration must not compete with them
- Text contrast meets WCAG AA
- Touch targets are at least 44 × 44 pt
- Respect iOS safe areas (notch/Dynamic Island at top, home indicator at bottom); the app runs full-bleed
- Primary navigation and actions are reachable by thumb

## Signature interaction: the dress-up picker

The defining moment of the app, used on the **Today** and **Outfit Builder** views:

- The outfit is shown as a vertical stack of slots: **Outerwear (optional), Top / Dress, Bottom, Shoes, Accessories (optional)**
- Each slot is a horizontal carousel: swipe left/right to cycle through the items that fit that slot
- A **match indicator** reacts as items change (e.g. a glowing `MATCH!` badge vs. a playful `CLASH` warning), driven by the recommender score
- A **shuffle** control randomizes unlocked slots; a **lock** on each slot keeps that item fixed while the others shuffle
- Choosing a dress hides the Top and Bottom slots

## Navigation

Bottom tab bar with 4 tabs:

1. **Today** (home)
2. **Closet**
3. **Outfits**
4. **History**

Settings is reached from a header icon on Today. Adding items uses a prominent button on the Closet tab.

## View inventory

### A. Entry

**A1. Splash / launch screen**
- Logo and wordmark shown while the app loads
- Also provide the **app icon** (shown on the iPhone home screen)

**A2. Login**
- Single user: email + password (or a single passcode field), sign-in button
- States: default, loading, error (wrong credentials)

**A3. First-run welcome (empty closet)**
- Shown when the closet has no items
- Short welcome plus two actions: **Bulk upload photos** (primary) and **Add one item**

### B. Today (home tab)

**B1. Today**
- Header: greeting, date, settings icon
- Weather card: current temperature, conditions icon, high/low
- Occasion selector: chips for Casual / Smart casual / Formal (maps to formality)
- Suggested outfit in the dress-up picker layout (see above), with match indicator
- Actions: **Shuffle**, **Wear this** (logs today's outfit), **Save outfit**
- States: loading suggestion, not enough items to build an outfit (prompt to add more), weather unavailable

**B2. Wear confirmation (bottom sheet)**
- Confirms "Logged for today" with an outfit thumbnail
- Optional 1–5 rating (how much the user liked the outfit)
- Done button

### C. Closet tab

**C1. Closet grid**
- Header: title, item count, search field
- Category filter chips: All, Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories
- Filter button opening C2, showing active filter count
- 2- or 3-column grid of item cards (background-removed photo, small status badge for Laundry/Stored)
- Banner or chip showing the number of **drafts** (untagged items), linking to C4
- Floating or header **Add** button opening C3
- States: empty closet, no search/filter results

**C2. Filter sheet (bottom sheet)**
- Color (swatch multi-select), Season (Spring/Summer/Fall/Winter), Formality (1–5), Warmth (1–5), Status (Clean/Laundry/Stored)
- Clear all, Apply

**C3. Add menu (bottom sheet or action sheet)**
- **Take photo**, **Choose from library**, **Bulk upload**

**C4. Drafts list**
- Grid of untagged/incomplete items with a "needs tags" indicator
- Tapping one opens the review flow (F4); option to select multiple and quick-tag (F3)

**C5. Item detail**
- Large background-removed photo
- Name, category/subcategory, color swatches, pattern, material, seasons, formality and warmth, brand, price, purchase date, custom tags
- Stats: times worn, last worn, cost per wear (if price is set)
- "In outfits" row: thumbnails of saved outfits containing this item
- Status toggle: Clean / Laundry / Stored
- Actions: Edit, Delete (with confirmation dialog)

### D. Add single item flow

**D1. Camera / photo capture**
- Uses the system camera or photo picker (iOS-provided UI); design only the screen that launches it and any framing tips

**D2. Background removal preview**
- Processing state with a fun loading treatment
- Result: before/after toggle, option to keep the original photo instead
- Continue button

**D3. Item details form**
- Photo thumbnail at top
- Fields: Name, Category, Subcategory, Colors (swatch multi-select), Pattern, Material, Seasons (multi-select chips), Formality (1–5 slider or segmented control), Warmth (1–5 slider or segmented control), Brand, Price, Purchase date, Tags (free-form chips)
- Only Category is required; everything else is optional
- Save, plus **Save as draft**
- States: validation error on Category

**D4. Saved confirmation**
- Brief success state (toast or celebratory screen), with **Add another** and **View in closet**

D3 is also reused as **Edit item**.

### E. Outfits tab

**E1. Outfits list**
- Grid of saved outfits (collage thumbnail of the items)
- Filter chips by occasion
- **New outfit** button opening E3
- Empty state

**E2. Outfit detail**
- Items shown in the slot layout
- Name, occasion, times worn, last worn
- Actions: **Wear today**, Edit, Delete

**E3. Outfit builder**
- Dress-up picker layout with every slot, manually controlled (shuffle available)
- Tapping a slot opens E4
- Name field and occasion selector, Save

**E4. Slot item picker (bottom sheet)**
- Grid of closet items filtered to that slot's category, with search
- Option to clear the slot (for optional slots)

### F. Bulk upload flow

**F1. Multi-photo select**
- Launches the system photo library with multi-select; design the launching screen and a selected-count summary

**F2. Processing**
- Progress for the batch (e.g. "Removing backgrounds 12/30"), with thumbnails appearing as they finish
- Option to continue to review while processing finishes

**F3. Review queue**
- Grid of all uploaded items, each showing tagged / untagged state
- Multi-select mode: tap items to select, then open the **Quick-tag panel**
- **Quick-tag panel (bottom sheet):** apply shared values to all selected items at once (Category, Colors, Seasons, Formality, Warmth, Tags)
- Actions: **Save all**, **Save untagged as drafts**, remove an item from the batch

**F4. One-by-one review**
- Swipe through items one at a time with a compact version of the D3 form
- Next / Previous / Skip

**F5. Batch complete**
- Summary: X items added, Y saved as drafts
- Actions: **View closet**, **Finish drafts**

### G. History tab

**G1. Wear history**
- Reverse-chronological list grouped by date: outfit thumbnail, items worn, weather that day, rating
- Tap an entry for G2
- Empty state

**G2. Wear entry detail**
- Items worn, date, weather snapshot, rating
- Actions: Edit rating, Delete entry

### H. Settings

**H1. Settings**
- Weather location: use current location or set a city
- Temperature unit: °F / °C
- Log out
- App version

## Shared components to define

- Bottom tab bar
- Header (title, actions)
- Buttons: primary (glossy/jelly), secondary, destructive, icon button
- Chips (filter, selectable, removable tag)
- Item card (grid) and outfit card (collage)
- Dress-up slot carousel with lock control
- Match / clash indicator
- Weather card
- Bottom sheet
- Form controls: text input, select, color swatch picker, season chips, 1–5 scale control, date picker trigger
- Retro "window" panel (title bar + content) as a decorative container option
- Toasts, confirmation dialog
- Loading treatment (Y2K progress bar or spinner)
- Empty state illustration style

## Global states to cover

- Loading (initial and in-place)
- Empty states (closet, outfits, history, drafts)
- Error (network failure, upload failure)
- Offline banner
- Destructive-action confirmation (delete item, outfit, or wear entry)

## Future views (optional, not in MVP)

- AI auto-tagging review (pre-filled form) and AI stylist chat
- Outfit calendar (plan ahead, month view)
- Packing list builder
- Closet stats dashboard
- Declutter queue, wishlist
