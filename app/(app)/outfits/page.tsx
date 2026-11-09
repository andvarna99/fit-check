import { Suspense } from "react";

import { ScreenHeader } from "@/components/ui/screen-header";
import { listOutfits } from "@/lib/outfits/queries";

import { OutfitsView } from "./outfits-view";

export const metadata = { title: "Outfits" };

async function OutfitsData() {
  const outfits = await listOutfits();
  return <OutfitsView outfits={outfits} />;
}

function OutfitsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your outfits">
      <ScreenHeader title="Outfits" />
      <div className="gutter mt-3 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-[var(--radius-md)] bg-surface-100" />
        ))}
      </div>
    </div>
  );
}

export default function OutfitsPage() {
  return (
    <Suspense fallback={<OutfitsSkeleton />}>
      <OutfitsData />
    </Suspense>
  );
}
