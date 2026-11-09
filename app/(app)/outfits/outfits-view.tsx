"use client";

import Link from "next/link";
import { useState } from "react";

import { OutfitCollage } from "@/components/outfits/outfit-collage";
import { Chip, ChipRow } from "@/components/ui/chip";
import { Icon, Sparkle } from "@/components/ui/icon";
import { ScreenHeader } from "@/components/ui/screen-header";
import { WindowPanel } from "@/components/ui/window-panel";
import { OCCASIONS } from "@/lib/closet/constants";
import { outfitMeta } from "@/lib/outfits/format";
import type { OutfitSummary } from "@/lib/outfits/queries";
import { OCCASION_LABEL, type Occasion } from "@/lib/outfits/slots";

export function OutfitsView({ outfits }: { outfits: OutfitSummary[] }) {
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const visible = occasion ? outfits.filter((o) => o.occasion === occasion) : outfits;
  const meta = `${outfits.length} saved`;

  if (outfits.length === 0) {
    return (
      <>
        <ScreenHeader title="Outfits" meta={meta} />
        <div className="gutter flex flex-col gap-6 pt-6">
          <WindowPanel title="Outfits.exe" className="mx-6" bodyClassName="p-0">
            <div className="relative flex h-[170px] items-center justify-center gap-3">
              <span className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-lavender-300 text-lavender-500">
                <Icon name="plus" />
              </span>
              <span className="h-16 w-16 rounded-xl border-2 border-dashed border-lavender-300" />
              <Sparkle size={20} className="absolute top-6 right-9 text-pink-400" />
              <span className="fc-plaid absolute inset-x-0 bottom-0 h-3" aria-hidden />
            </div>
          </WindowPanel>
          <div className="flex flex-col gap-1.5 px-3 text-center">
            <h2 className="type-title-md">No outfits saved yet</h2>
            <p className="type-body text-ink-muted">Mix pieces in the builder and save the looks you love.</p>
          </div>
          <div className="flex justify-center">
            <Link href="/outfits/new" className="fc-btn fc-btn--primary">
              <span>New outfit</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Outfits" meta={meta} />
      <div className="flex flex-col gap-3">
        <ChipRow label="Occasion">
          <Chip selected={occasion === null} onClick={() => setOccasion(null)}>
            All
          </Chip>
          {OCCASIONS.map((o) => (
            <Chip key={o} selected={occasion === o} onClick={() => setOccasion(occasion === o ? null : o)}>
              {OCCASION_LABEL[o]}
            </Chip>
          ))}
        </ChipRow>

        {visible.length ? (
          <ul className="gutter grid grid-cols-2 gap-3">
            {visible.map((o) => (
              <li key={o.id} className="min-w-0">
                <Link href={`/outfits/${o.id}`} className="flex flex-col gap-1.5">
                  <OutfitCollage pieces={o.pieces} />
                  <span className="flex flex-col">
                    <span className="truncate type-body-strong">{o.name ?? "Untitled outfit"}</span>
                    <span className="type-caption">{outfitMeta(o)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="gutter type-body text-ink-muted">
            No {occasion ? OCCASION_LABEL[occasion].toLowerCase() : ""} outfits yet.
          </p>
        )}
      </div>

      <Link href="/outfits/new" className="fc-btn fc-btn--primary fc-fab">
        <Icon name="plus" size={20} />
        <span>New outfit</span>
      </Link>
    </>
  );
}
