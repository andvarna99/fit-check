import { Suspense } from "react";

import { ScreenHeader } from "@/components/ui/screen-header";
import { listWearLogs } from "@/lib/outfits/queries";

import { HistoryView } from "./history-view";

export const metadata = { title: "History" };

async function HistoryData() {
  const entries = await listWearLogs();
  return <HistoryView entries={entries} />;
}

function HistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your history">
      <ScreenHeader title="History" />
      <div className="gutter mt-3 flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[84px] animate-pulse rounded-[var(--radius-md)] bg-surface-100" />
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryData />
    </Suspense>
  );
}
