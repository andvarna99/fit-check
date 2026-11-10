import { Suspense } from "react";

import { listClosetItems } from "@/lib/closet/queries";
import { listRecentWears } from "@/lib/outfits/queries";

import { TodayHeader, TodayView } from "./today-view";

export const metadata = { title: "Today" };

/** Recency stops mattering after two weeks, so that's all the history Today needs. */
const RECENT_DAYS = 15;

async function TodayData() {
  const [items, recentWears] = await Promise.all([listClosetItems(), listRecentWears(RECENT_DAYS)]);
  // Suggestions use finished pieces that are clean (not in the laundry or stored).
  const wearable = items.filter((i) => !i.isDraft && i.category !== null && i.status === "clean");
  return <TodayView items={wearable} recentWears={recentWears} />;
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading Today">
      <TodayHeader />
      <div className="gutter mt-2 flex flex-col gap-3">
        <div className="h-[60px] animate-pulse rounded-[28px] bg-blue-200/60" />
        <div className="h-[420px] animate-pulse rounded-[var(--radius-lg)] bg-surface-100" />
      </div>
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <TodayData />
    </Suspense>
  );
}
