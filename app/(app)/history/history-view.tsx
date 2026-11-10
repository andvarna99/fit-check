"use client";

import Link from "next/link";

import { OutfitCollage } from "@/components/outfits/outfit-collage";
import { WeatherText } from "@/components/outfits/weather-text";
import { Sparkle } from "@/components/ui/icon";
import { ScreenHeader } from "@/components/ui/screen-header";
import { RatingLabel } from "@/components/ui/star-rating";
import { WindowPanel } from "@/components/ui/window-panel";
import { categoryLine } from "@/lib/closet/options";
import { groupByHistoryLabel, wearDayLabel } from "@/lib/outfits/dates";
import type { WearEntry } from "@/lib/outfits/queries";
import { useLocalToday } from "@/lib/ui/use-local-today";

function daysLogged(entries: WearEntry[]): string {
  const n = new Set(entries.map((e) => e.wornOn)).size;
  return `${n} ${n === 1 ? "day" : "days"} logged`;
}

function itemsLine(entry: WearEntry): string {
  const names = entry.pieces.map((p) => p.name ?? categoryLine(p.category, p.subcategory));
  const text = names.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function HistoryView({ entries }: { entries: WearEntry[] }) {
  const today = useLocalToday();

  if (entries.length === 0) return <HistoryEmpty />;
  if (today === null) return <ScreenHeader title="History" meta={daysLogged(entries)} />;

  const groups = groupByHistoryLabel(entries, today);

  return (
    <>
      <ScreenHeader title="History" meta={daysLogged(entries)} />
      <div className="gutter flex flex-col gap-5 pt-1 pb-6">
        {groups.map((group) => (
          <section key={group.label} className="flex flex-col gap-2" aria-labelledby={`h-${group.label}`}>
            <h2 id={`h-${group.label}`} className="type-title-sm">
              {group.label}
            </h2>
            <ul className="fc-group">
              {group.entries.map((entry) => (
                <li key={entry.id} className="border-t border-line first:border-t-0">
                  <Link href={`/history/${entry.id}`} className="flex min-h-[84px] items-center gap-3 px-3 py-2.5">
                    <OutfitCollage pieces={entry.pieces} className="!h-16 !w-16 flex-none !rounded-[10px] !shadow-[inset_0_0_0_1px_var(--line)]" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="type-body-strong">{wearDayLabel(entry.wornOn, today)}</span>
                        <RatingLabel value={entry.rating} />
                      </span>
                      <span className="truncate type-caption">{entry.outfit?.name ?? itemsLine(entry)}</span>
                      {entry.weather ? <span className="type-caption !text-blue-700"><WeatherText weather={entry.weather} format="line" /></span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function HistoryEmpty() {
  return (
    <>
      <ScreenHeader title="History" meta="0 days logged" />
      <div className="gutter flex flex-col gap-6 pt-6">
        <WindowPanel title="Diary.exe" className="mx-6">
          <div className="relative grid grid-cols-7 gap-1.5 p-2">
            {Array.from({ length: 21 }, (_, i) => (
              <span
                key={i}
                className={`aspect-square rounded-[4px] shadow-[inset_0_0_0_1px_var(--line)] ${i === 15 ? "bg-lavender-100" : "bg-surface-050"}`}
              />
            ))}
            <Sparkle size={18} className="absolute -top-1 right-0 text-pink-400" />
          </div>
        </WindowPanel>
        <div className="flex flex-col gap-1.5 px-3 text-center">
          <h2 className="type-title-md">Nothing logged yet</h2>
          <p className="type-body text-ink-muted">Tap Wear today on an outfit and it lands here, with your rating.</p>
        </div>
        <div className="flex justify-center">
          <Link href="/outfits" className="fc-btn fc-btn--primary">
            <span>Go to outfits</span>
          </Link>
        </div>
      </div>
    </>
  );
}
