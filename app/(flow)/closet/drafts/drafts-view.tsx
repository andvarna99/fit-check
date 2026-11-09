"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { QuickTagSheet } from "@/components/closet/quick-tag-sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ItemCard } from "@/components/ui/item-card";
import { BarHeader } from "@/components/ui/screen-header";

import { quickTagItems } from "../actions";

export type DraftCard = { id: string; name: string | null; thumb: string | null };

export function DraftsView({ drafts }: { drafts: DraftCard[] }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [tagOpen, setTagOpen] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected([]);
  }

  const n = selected.length;

  return (
    <div className="flex min-h-dvh flex-col">
      <BarHeader
        title="Drafts"
        start={
          <Link href="/closet" className="fc-iconbtn" aria-label="Back to closet">
            <Icon name="left" />
          </Link>
        }
        end={
          drafts.length ? (
            <Button variant="ghost" size="sm" onClick={selecting ? stopSelecting : () => setSelecting(true)}>
              {selecting ? "Cancel" : "Select"}
            </Button>
          ) : null
        }
      />

      {drafts.length === 0 ? (
        <div className="gutter flex flex-col gap-2 pt-6">
          <h2 className="type-title-md">All tagged</h2>
          <p className="type-body text-ink-muted">No drafts left. Every piece is ready for outfits.</p>
        </div>
      ) : (
        <>
          <p className="gutter type-body text-ink-muted">
            {drafts.length} {drafts.length === 1 ? "item needs" : "items need"} tags. Tap to tag one, or select a few and tag them together.
          </p>
          <ul className="gutter mt-4 grid flex-1 grid-cols-3 content-start gap-2 pb-6">
            {drafts.map((d) => (
              <li key={d.id} className="min-w-0">
                <ItemCard
                  href={selecting ? undefined : `/closet/${d.id}/edit`}
                  onClick={selecting ? () => toggle(d.id) : undefined}
                  selectable={selecting}
                  selected={selected.includes(d.id)}
                  src={d.thumb}
                  draft
                  name={d.name}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {selecting ? (
        <div className="fc-actionbar items-center">
          <div className="min-w-0">
            <p className="type-pixel-sm">{n} selected</p>
            <p className="type-caption">{n ? `Same values go to all ${n}` : "Tap items to select them"}</p>
          </div>
          <Button className="flex-none" disabled={n === 0} onClick={() => setTagOpen(true)}>
            Quick-tag
          </Button>
        </div>
      ) : null}

      <QuickTagSheet
        open={tagOpen}
        onClose={() => setTagOpen(false)}
        thumbs={drafts.filter((d) => selected.includes(d.id)).map((d) => d.thumb)}
        onApply={async (patch) => {
          const result = await quickTagItems(selected, patch, true);
          if (!result.ok) return result.error;
          stopSelecting();
          router.refresh();
          return null;
        }}
      />
    </div>
  );
}
