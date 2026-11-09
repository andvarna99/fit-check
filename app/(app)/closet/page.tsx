import { Suspense } from "react";

import { ScreenHeader } from "@/components/ui/screen-header";
import { listClosetItems } from "@/lib/closet/queries";

import { ClosetView } from "./closet-view";
import { ClosetWelcome } from "./welcome";

export const metadata = { title: "Closet" };

async function ClosetData() {
  const all = await listClosetItems();
  if (all.length === 0) return <ClosetWelcome />;
  const finished = all.filter((i) => !i.isDraft);
  return <ClosetView items={finished} draftCount={all.length - finished.length} />;
}

function ClosetSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your closet">
      <ScreenHeader title="Closet" />
      <div className="gutter mt-3 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-[var(--radius-md)] bg-surface-100" />
        ))}
      </div>
    </div>
  );
}

export default function ClosetPage() {
  return (
    <Suspense fallback={<ClosetSkeleton />}>
      <ClosetData />
    </Suspense>
  );
}
