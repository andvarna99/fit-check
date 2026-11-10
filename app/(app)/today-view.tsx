"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";

import { saveOutfit, wearPieces } from "@/app/(flow)/outfits/actions";
import { DressUpPanel } from "@/components/outfits/dress-up-panel";
import { OutfitScoreRow } from "@/components/outfits/outfit-score-row";
import { WearSheet } from "@/components/outfits/wear-sheet";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { Chip, ChipRow } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { WindowPanel } from "@/components/ui/window-panel";
import { OCCASIONS } from "@/lib/closet/constants";
import type { ClosetItem } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";
import { localIsoDate } from "@/lib/outfits/dates";
import type { RecentWear } from "@/lib/outfits/queries";
import { OCCASION_LABEL, selectedIds, type BuilderRow, type Occasion, type Selection } from "@/lib/outfits/slots";
import { weatherRange, weatherTemp } from "@/lib/outfits/weather";
import { layerAdvice, seasonFor } from "@/lib/recommender/conditions";
import { closetReadiness, comboKey, scoreSelection, suggestOutfit, type Readiness } from "@/lib/recommender/generate";
import { piecesFromCloset } from "@/lib/recommender/pieces";
import type { ScoreContext } from "@/lib/recommender/types";
import { useLocalToday } from "@/lib/ui/use-local-today";
import { useStoredPreference } from "@/lib/ui/use-stored-preference";
import { useTempUnit } from "@/lib/weather/prefs";
import { loadWeather, useWeather, type WeatherState } from "@/lib/weather/store";

const noop = () => () => {};

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function longDate(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** "Good morning" and the date, from the device clock (plain "Today" while rendering on the server). */
export function TodayHeader() {
  const hello = useSyncExternalStore(noop, greeting, () => null);
  const date = useSyncExternalStore(noop, longDate, () => null);
  return (
    <header className="fc-header !items-start">
      <div className="fc-header__titles !flex-col !items-start !gap-0">
        <h1 className="type-title-lg">{hello ?? "Today"}</h1>
        <p className="type-body text-ink-muted">{date ?? " "}</p>
      </div>
      <div className="fc-header__actions">
        <Link href="/settings" className="fc-iconbtn fc-iconbtn--tonal" aria-label="Settings">
          <Icon name="settings" />
        </Link>
      </div>
    </header>
  );
}

function WeatherCard({ state }: { state: WeatherState }) {
  const [unit] = useTempUnit();
  if (state.status === "loading") {
    return <div className="h-[60px] animate-pulse rounded-[var(--radius-lg)] bg-blue-200/60" aria-label="Loading weather" />;
  }
  if (state.status === "unavailable") {
    return (
      <Banner tone="warning" icon={state.reason === "location" ? "pin" : "wifiOff"} className="!rounded-[var(--radius-lg)]">
        <span className="flex items-center justify-between gap-2">
          <span>
            {state.reason === "location" ? (
              <>
                No location for weather. Picks skip temperature.{" "}
                <Link href="/settings" className="underline">
                  Set a city
                </Link>
              </>
            ) : (
              "Weather's unavailable. Picks skip temperature."
            )}
          </span>
          <Button variant="ghost" size="sm" className="!flex-none" onClick={() => void loadWeather(true)}>
            Retry
          </Button>
        </span>
      </Banner>
    );
  }
  const { weather } = state;
  const range = weatherRange(weather, unit);
  return (
    <section className="fc-wx" aria-label="Weather">
      <span className="fc-wx__temp">{weatherTemp(weather, unit)}</span>
      <div className="min-w-0 flex-1">
        <p className="type-callout">{weather.condition}</p>
        {range ? <p className="type-caption !text-blue-700">{range}</p> : null}
      </div>
      <Badge tone="info" className="!bg-surface-000 !text-blue-700">
        {layerAdvice(weather)}
      </Badge>
    </section>
  );
}

function NotEnough({ readiness }: { readiness: Readiness }) {
  return (
    <WindowPanel title="Dress-up.exe" bodyClassName="flex flex-col gap-4 px-5 pt-6 pb-5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Badge tone="draft">{`Need ${readiness.missing} more`}</Badge>
        <h2 className="type-title-md">Almost ready to style you</h2>
        <p className="type-body text-ink-muted">An outfit needs a top and a bottom (or a dress), plus shoes. Here&apos;s what&apos;s missing.</p>
      </div>
      <ul className="fc-group !shadow-none ring-1 ring-lavender-100">
        {readiness.rows
          .filter((row) => row.need > 0 || row.have > 0)
          .map((row) => (
            <li key={row.key} className="fc-li">
              <span className="type-body-strong">{row.label}</span>
              {row.have >= row.need ? <Badge tone="clean">{`${row.have} added`}</Badge> : <Badge tone="draft">{`Need ${row.need - row.have}`}</Badge>}
            </li>
          ))}
      </ul>
      <p className="type-caption text-center">Only clean, tagged pieces count.</p>
    </WindowPanel>
  );
}

function StylingSkeleton() {
  return (
    <WindowPanel title="Dress-up.exe" plain bodyClassName="flex flex-col gap-2 p-2">
      <div className="px-2 pt-2 pb-1" role="status">
        <span className="type-pixel-lg text-ink">Styling...</span>
      </div>
      {[44, 108, 108, 92, 44].map((h, i) => (
        <div key={i} className="animate-pulse rounded-[var(--radius-md)] bg-surface-100" style={{ height: h }} />
      ))}
    </WindowPanel>
  );
}

/** Each item's last wear before today, so logging today's outfit doesn't mark it down. */
function lastWornBefore(wears: RecentWear[], today: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const w of wears) {
    if (today && w.wornOn >= today) continue;
    for (const id of w.itemIds) if (!out[id] || out[id] < w.wornOn) out[id] = w.wornOn;
  }
  return out;
}

const setKey = (ids: readonly string[]) => [...ids].sort().join(",");

const OCCASION_KEY = "fc-today-occasion";

type TodayViewProps = { items: ClosetItem[]; recentWears: RecentWear[] };

export function TodayView({ items, recentWears }: TodayViewProps) {
  const router = useRouter();
  const today = useLocalToday();
  const weatherState = useWeather();
  const [occasion, setOccasion] = useStoredPreference<Occasion>(OCCASION_KEY, OCCASIONS, "casual");

  const pieces = useMemo(() => piecesFromCloset(items, lastWornBefore(recentWears, today)), [items, recentWears, today]);
  const readiness = useMemo(() => closetReadiness(pieces), [pieces]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categoryOf = (id: string) => byId.get(id)?.category ?? undefined;

  const weather = weatherState.status === "ready" ? weatherState.weather : null;
  const latitude = weatherState.status === "ready" ? weatherState.latitude : null;
  const ctx: ScoreContext = useMemo(
    () => ({ occasion, weather, season: today ? seasonFor(today, latitude) : null, today }),
    [occasion, weather, latitude, today],
  );

  const [locked, setLocked] = useState<ReadonlySet<BuilderRow>>(new Set());
  // The suggestion is remade when the occasion changes or the weather becomes
  // known (or fails); hand edits are kept otherwise.
  const pickKey = `${occasion}|${weather ? "wx" : "no-wx"}`;
  const settled = today !== null && weatherState.status !== "loading";
  const [pick, setPick] = useState<{ key: string; selection: Selection | null } | null>(null);
  if (settled && readiness.ready && pick?.key !== pickKey) {
    const keep = pick?.selection ? Object.fromEntries([...locked].map((row) => [row, pick.selection![row]])) : {};
    const suggestion = suggestOutfit(pieces, ctx, { locked: keep, accessories: pick?.selection?.accessories });
    setPick({ key: pickKey, selection: suggestion?.selection ?? null });
  }
  const selection = pick?.selection ?? null;

  const [logged, setLogged] = useState<{ id: string; rating: number | null; day: string; set: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"wear" | "save" | null>(null);

  const ids = selection ? selectedIds(selection, categoryOf) : [];
  const idsKey = setKey(ids);
  const wornToday =
    today !== null && ((logged?.day === today && logged.set === idsKey) || recentWears.some((w) => w.wornOn === today && setKey(w.itemIds) === idsKey));
  const savedId = saved[idsKey];
  const score = selection ? scoreSelection(selection, pieces, ctx) : null;

  function updateSelection(update: (s: Selection) => Selection) {
    setPick((p) => (p?.selection ? { ...p, selection: update(p.selection) } : p));
    setError(null);
  }

  function toggleLock(row: BuilderRow, on: boolean) {
    setLocked((prev) => {
      const next = new Set(prev);
      if (on) next.add(row);
      else next.delete(row);
      return next;
    });
  }

  function shuffle() {
    if (!selection) return;
    const keep = Object.fromEntries([...locked].map((row) => [row, selection[row]]));
    const next = suggestOutfit(pieces, ctx, {
      locked: keep,
      accessories: selection.accessories,
      avoid: comboKey(selection),
      variety: { top: 6, spread: 15 },
    });
    if (next) setPick({ key: pickKey, selection: next.selection });
    setError(null);
  }

  function wear() {
    const day = localIsoDate();
    setError(null);
    setAction("wear");
    startTransition(async () => {
      const result = await wearPieces(ids, day, weather);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLogged({ id: result.logId, rating: result.rating, day, set: idsKey });
      setSheetOpen(true);
    });
  }

  function save() {
    if (savedId) {
      router.push(`/outfits/${savedId}`);
      return;
    }
    setError(null);
    setAction("save");
    startTransition(async () => {
      const result = await saveOutfit(null, { name: "", occasion, itemIds: ids }, "rules");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved((s) => ({ ...s, [idsKey]: result.id }));
    });
  }

  const thumbs = ids.map((id) => byId.get(id)).flatMap((i) => (i ? [imageSrc(i.thumbUrl ?? i.imageUrl)] : [])).filter((s): s is string => !!s);
  const showPanel = readiness.ready && selection !== null;

  return (
    <div className="flex flex-col pb-3">
      <TodayHeader />

      <div className="gutter mt-2">
        <WeatherCard state={weatherState} />
      </div>

      {readiness.ready ? (
        <ChipRow label="Occasion" className="mt-3">
          {OCCASIONS.map((o) => (
            <Chip key={o} selected={occasion === o} onClick={() => setOccasion(o)}>
              {OCCASION_LABEL[o]}
            </Chip>
          ))}
        </ChipRow>
      ) : null}

      <div className="gutter mt-3 flex flex-col gap-3">
        {!readiness.ready ? (
          <>
            <NotEnough readiness={readiness} />
            <Link href="/closet/new" className="fc-btn fc-btn--primary fc-btn--block">
              Add items
            </Link>
          </>
        ) : showPanel ? (
          <DressUpPanel
            title="Dress-up.exe"
            items={items}
            selection={selection}
            onSelectionChange={updateSelection}
            locked={locked}
            onLockedChange={toggleLock}
            header={score ? <OutfitScoreRow score={score} selection={selection} /> : null}
          />
        ) : (
          <StylingSkeleton />
        )}

        {error ? <Banner tone="error">{error}</Banner> : null}

        {readiness.ready ? (
          <div className="flex items-center gap-3">
            <IconButton icon="shuffle" label="Shuffle unlocked slots" variant="tonal" className="!h-14 !w-14 flex-none" onClick={shuffle} disabled={!showPanel || pending} />
            <Button
              className="flex-1"
              icon={wornToday ? "check" : undefined}
              loading={pending && action === "wear"}
              loadingLabel="Logging..."
              disabled={!showPanel || ids.length === 0 || (pending && action !== "wear")}
              onClick={wornToday && logged ? () => setSheetOpen(true) : wear}
            >
              {wornToday ? "Worn today" : "Wear this"}
            </Button>
            <IconButton
              icon={savedId ? "check" : "bookmark"}
              label={savedId ? "Saved. View outfit" : "Save outfit"}
              variant="tonal"
              className="!h-14 !w-14 flex-none"
              onClick={save}
              disabled={!showPanel || ids.length === 0 || pending}
            />
          </div>
        ) : null}
      </div>

      {logged ? (
        <WearSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          log={logged}
          thumbs={thumbs}
          weather={weather}
          onRated={(rating) => setLogged({ ...logged, rating })}
        />
      ) : null}
    </div>
  );
}
