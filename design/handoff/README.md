# Fit Check: Mobile UI design handoff

Mobile mockups for every MVP view in `DESIGN_BRIEF.md`, built on the **Fit Check** design system. Light mode only, iPhone 390 × 844 pt, full-bleed iOS PWA.

## Package layout

```
design_handoff_fit_check_mobile/
├── _ds/fit-check-c3fd0814-…/        Fit Check design system
│   ├── tokens/
│   │   ├── colors.css               color + gradient custom properties
│   │   ├── typography.css           font families, type scale, .type-* helpers
│   │   ├── spacing.css              space-1 … space-7
│   │   ├── base.css                 radius, sizes (tap-min, tabbar-h…), shadows, safe areas
│   │   ├── motion.css               durations + easing
│   │   └── fonts.css                Google Fonts import
│   ├── components/components.css    .fc-* component styles
│   ├── _ds_bundle.js                React components on window.FitCheck
│   └── styles.css                   one-file entry: imports all of the above
├── assets/mark.svg                  app icon (180 × 180 artwork; iOS applies its own mask)
├── *.dc.html                        one file per screen (index below)
├── fc.css                           shared styles used by the screen mockups
└── support.js                       standalone runtime that renders the .dc.html files
```

## Viewing the screens

The screens load sibling files, so serve the folder rather than opening files directly:

```bash
cd design_handoff_fit_check_mobile
npx serve .            # or: python3 -m http.server
# open http://localhost:3000/Main.dc.html
```

Buttons and tabs are linked, so you can click through the flows. Fonts load from Google Fonts, so you need to be online.

## Screen index

| Brief | File | Notes |
|---|---|---|
| A1 | `AppIcon.dc.html`, `Splash.dc.html` | Icon artwork also in `assets/mark.svg` |
| A2 | `Login.dc.html`, `LoginError.dc.html` | Email + password. Loading = button reads "Signing in…" (see Components) |
| A3 | `Welcome.dc.html` | Empty closet: Bulk upload (primary), Add one item |
| B1 | `Main.dc.html` | Today: weather, occasion, dress-up picker, MATCH! |
| B1 states | `TodayLoading.dc.html`, `TodayNotEnough.dc.html` | Loading suggestion + weather unavailable; not enough items |
| B2 | `WearSheet.dc.html` | Logged for today, optional 1–5 rating |
| C1 | `Closet.dc.html`, `ClosetNoResults.dc.html` | No-results screen also shows the offline banner |
| C2 | `FilterSheet.dc.html` | Color, season, formality, warmth, status |
| C3 | `AddMenu.dc.html` | Take photo / Choose from library / Bulk upload |
| C4 | `Drafts.dc.html` | Shown in multi-select mode, 3 selected → Quick-tag |
| C5 | `ItemDetail.dc.html` (full scroll, 1300 tall), `DeleteDialog.dc.html` | |
| D1 | `Capture.dc.html` | Launches the iOS camera / picker; framing tips |
| D2 | `BgProcessing.dc.html`, `BgResult.dc.html` | Scan-line loader; before/after toggle; keep original |
| D3 | `ItemForm.dc.html` (full scroll, 1500 tall), `ItemFormError.dc.html` | Reused as Edit item |
| D4 | `Saved.dc.html` | Add another / View closet |
| E1 | `Outfits.dc.html`, `OutfitsEmpty.dc.html` | |
| E2 | `OutfitDetail.dc.html` | Wear today, Edit, Delete |
| E3 | `Builder.dc.html` | Shows CLASH, a locked slot, and a dress hiding Bottom |
| E4 | `SlotPicker.dc.html` | Accessory picker with Clear slot |
| F1 | `BulkSelect.dc.html` | Selected-count summary |
| F2 | `BulkProcessing.dc.html` | 12/30 progress, upload-failure banner, Start review |
| F3 | `Review.dc.html`, `QuickTag.dc.html` | Save all / Save drafts; quick-tag sheet for 4 items |
| F4 | `OneByOne.dc.html` | Compact form, Previous / Next / Skip |
| F5 | `BatchDone.dc.html` | X added, Y drafts |
| G1 | `History.dc.html`, `HistoryEmpty.dc.html` | Grouped by week |
| G2 | `WearEntry.dc.html` | Weather snapshot, editable rating, delete |
| H1 | `Settings.dc.html` | Location, °F/°C, log out, version |
| — | `Components.dc.html` | Shared components sheet (1280 wide) |
| — | `TabBar.dc.html`, `Garment.dc.html` | Child components imported by the screens |

## Mapping to the design system

The mockups are plain HTML with `fc.css` classes. In the app, build them from the design system:

| Mockup class / element | Design system |
|---|---|
| `.btn-p / .btn-s / .btn-d / .btn-g` | `<Button variant="primary/secondary/destructive/ghost">`, `.fc-btn--*` |
| `.ib` | `<IconButton>` |
| `.chip`, `.chip.on`, `.chip.out` | `<Chip>` (select, `selected`, `variant="filter"`, `variant="tag"`) |
| `.badge.b-laundry / b-stored / b-clean` | `.fc-badge--*` |
| `.badge.b-tags` (Needs tags) | `.fc-badge--draft` (DS uses yellow-100 / yellow-800; the mockups use pink, so pick one) |
| `.card` + `.ph` + `.cardcap` | `<ItemCard>` |
| `.slot`, `.lock`, `.car` | `<DressUpSlot>` (the DS version is taller, with a header row and a 120px main image; the mockups use a compact 66–104px row so all slots fit above the tab bar on Today) |
| `.match`, `.clash` | `<MatchBadge state="match/clash/thinking">` |
| `TabBar.dc.html` | `<TabBar>` |
| `.sheet` + `.grab` + `.scrim` | `<BottomSheet>` |
| `.win` + `.win-bar` | `<WindowPanel>` |
| `.prog` | `.fc-progress` |
| `Garment.dc.html` | Placeholder art. Replace with the background-removed item photo |

Token names in `fc.css` are short aliases (`--l700` = `--lavender-700`, `--s50` = `--surface-050`, `--mut` = `--ink-muted`). The values are identical to `_ds/…/tokens`.

## Layout rules

- Side gutter 16; section gap 24; stack gap 16. Grids: 2-col gap 12 (closet), 3-col gap 8 (drafts, review, pickers).
- Safe areas: content starts 59pt down (Dynamic Island); the tab bar is 56 + 34 (home indicator) = 90 tall. Sheets and pinned action bars pad 34 at the bottom.
- Primary actions sit in the bottom third: above the tab bar, pinned in a bottom bar, or at the bottom of a sheet.
- Touch targets are ≥ 44 × 44. Chips look 36 tall but have a 44 hit area.
- One primary button, at most one holo surface and one yellow element per screen.

## Interaction notes

- **Dress-up slot:** swipe left/right or tap the chevrons. The label announces "Top, 3 of 12, Cream knit tee". The lock button keeps an item through Shuffle. A locked slot gets a chrome frame and the label "Locked". Optional slots (Outerwear, Accessory) collapse to a dashed "+ add" row.
- **Dress rule:** choosing a dress in Top / Dress hides Bottom and shows "Bottom hidden while a dress is on".
- **Shuffle:** re-rolls unlocked slots with a 60ms per-slot stagger.
- **Match indicator:** updates on every change with a 320ms springy pop (`--ease-pop`). The thresholds in the mockups (≥ 70 MATCH!, < 50 CLASH, score alone in between) are placeholders: set them from the recommender.
- **Sheets** slide in over 240ms with a scrim. Tapping the scrim or swiping down closes them.
- **Wear this** logs today's outfit and opens B2. The rating is optional; Done closes the sheet.
- **Reduced motion:** swap pops for fades and drop the sparkle twinkle.

## Copy rules

- Sentence case everywhere. Buttons and badges are written in sentence case and uppercased by CSS in Silkscreen, so screen readers read words.
- Exclamation marks only on `MATCH!` and the batch-complete headline.
- Errors say what happened and what to do ("That password didn't work. Try again.").

## Open items

- Real clothing photos: every item image is placeholder art from `Garment.dc.html`.
- Brand field on Item detail is a `[Brand]` placeholder.
- App icon is a first concept; the design system has no logo yet.
- Needs-tags badge color: mockups use pink, the DS component uses yellow. Decide one.
