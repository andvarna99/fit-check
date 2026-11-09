/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";
import { categoryLine } from "@/lib/closet/options";
import { imageSrc } from "@/lib/images/url";
import { wearDayTitle } from "@/lib/outfits/dates";
import { getWearLog, type WearEntry } from "@/lib/outfits/queries";
import { weatherRange, weatherTemp } from "@/lib/outfits/weather";

import { DeleteWearButton, EntryRating } from "./entry-controls";

export const metadata = { title: "Wear entry" };

function Entry({ entry }: { entry: WearEntry }) {
  const range = entry.weather ? weatherRange(entry.weather) : null;
  return (
    <div className="flex min-h-dvh flex-col">
      <BarHeader
        title=""
        start={
          <Link href="/history" className="fc-iconbtn" aria-label="Back to history">
            <Icon name="left" />
          </Link>
        }
      />
      <div className="gutter flex flex-1 flex-col gap-5 pb-6">
        <div>
          <p className="type-pixel-sm text-ink-muted">Worn on</p>
          <h1 className="type-title-lg">{wearDayTitle(entry.wornOn)}</h1>
        </div>

        {entry.weather ? (
          <section className="fc-wx" aria-label="Weather that day">
            <span className="fc-wx__temp">{weatherTemp(entry.weather)}</span>
            <div className="flex-1">
              <p className="type-callout">{entry.weather.condition}</p>
              {range ? <p className="type-caption !text-blue-700">{range}</p> : null}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="worn-title" className="flex flex-col gap-2">
          <h2 id="worn-title" className="type-title-sm">
            Items worn
          </h2>
          {entry.pieces.length ? (
            <ul className="grid grid-cols-4 gap-2">
              {entry.pieces.map((p) => {
                const name = p.name ?? categoryLine(p.category, p.subcategory);
                const src = imageSrc(p.thumbUrl ?? p.imageUrl);
                const body = (
                  <>
                    <span className="fc-item__photo">
                      {src ? <img src={src} alt="" /> : <span className="fc-item__ph"><Icon name="hanger" size={24} /></span>}
                    </span>
                    <span className="block truncate type-caption !text-ink">{name}</span>
                    {p.deleted ? <span className="block type-caption">Deleted</span> : null}
                  </>
                );
                return (
                  <li key={p.id} className="min-w-0">
                    {p.deleted ? <div className="fc-item">{body}</div> : <Link href={`/closet/${p.id}`} className="fc-item">{body}</Link>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="type-body text-ink-muted">No pieces were recorded for this day.</p>
          )}
          {entry.outfit ? (
            <p className="type-caption">
              From outfit{" "}
              <Link href={`/outfits/${entry.outfit.id}`} className="font-semibold text-lavender-700 underline">
                {entry.outfit.name ?? "Untitled outfit"}
              </Link>
            </p>
          ) : null}
        </section>

        <EntryRating id={entry.id} rating={entry.rating} />
      </div>
      <div className="gutter pb-10">
        <DeleteWearButton id={entry.id} day={wearDayTitle(entry.wornOn)} />
      </div>
    </div>
  );
}

async function EntryData({ params }: PageProps<"/history/[id]">) {
  const { id } = await params;
  const entry = await getWearLog(id);
  if (!entry) notFound();
  return <Entry entry={entry} />;
}

export default function WearEntryPage(props: PageProps<"/history/[id]">) {
  return (
    <Suspense fallback={<div className="gutter pt-16" aria-busy="true"><div className="h-64 animate-pulse rounded-[var(--radius-md)] bg-surface-100" /></div>}>
      <EntryData {...props} />
    </Suspense>
  );
}
