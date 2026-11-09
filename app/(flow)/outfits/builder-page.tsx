import Link from "next/link";

import { OutfitBuilder } from "@/components/outfits/outfit-builder";
import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";
import { WindowPanel } from "@/components/ui/window-panel";
import { listClosetItems } from "@/lib/closet/queries";
import type { OutfitSummary } from "@/lib/outfits/queries";
import { defaultSelection, selectionFromPieces } from "@/lib/outfits/slots";

/** Shared by /outfits/new and /outfits/[id]/edit. */
export async function BuilderPage({ outfit }: { outfit: OutfitSummary | null }) {
  const items = (await listClosetItems()).filter((i) => !i.isDraft && i.category);

  if (items.length === 0) {
    return (
      <>
        <BarHeader
          title="New outfit"
          start={
            <Link href="/outfits" className="fc-iconbtn" aria-label="Close builder">
              <Icon name="close" />
            </Link>
          }
        />
        <div className="gutter flex flex-col gap-6 pt-6">
          <WindowPanel title="Dress-up.exe">
            <div className="flex flex-col items-center gap-2 py-6 text-lavender-300">
              <Icon name="hanger" size={40} />
              <span className="type-pixel-sm text-ink-muted">0 pieces ready</span>
            </div>
          </WindowPanel>
          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="type-title-md">Nothing to dress up yet</h2>
            <p className="type-body text-ink-muted">Add and tag a few pieces in your closet, then come back to mix them.</p>
          </div>
          <Link href="/closet" className="fc-btn fc-btn--primary fc-btn--block">
            <span>Go to closet</span>
          </Link>
        </div>
      </>
    );
  }

  const initial = outfit
    ? {
        name: outfit.name ?? "",
        occasion: outfit.occasion,
        selection: selectionFromPieces(outfit.pieces.filter((p) => p.category).map((p) => ({ id: p.id, category: p.category! }))),
      }
    : { name: "", occasion: null, selection: defaultSelection(items) };

  return <OutfitBuilder outfitId={outfit?.id ?? null} items={items} initial={initial} />;
}

export function BuilderSkeleton() {
  return (
    <div className="gutter flex flex-col gap-3 pt-16" aria-busy="true" aria-label="Loading the builder">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-[var(--radius-md)] bg-surface-100" />
      ))}
    </div>
  );
}
