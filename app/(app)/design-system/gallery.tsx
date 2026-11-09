"use client";

import { useState, type ReactNode } from "react";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button, IconButton } from "@/components/ui/button";
import { Chip, ChipRow, TagChip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DressUpSlot, type SlotItem } from "@/components/ui/dress-up-slot";
import { ItemCard } from "@/components/ui/item-card";
import { MatchBadge } from "@/components/ui/match-badge";
import { Progress } from "@/components/ui/progress";
import { TextField } from "@/components/ui/text-field";
import { WindowPanel } from "@/components/ui/window-panel";
import { matchStateForScore } from "@/lib/ui/match";

const TOPS: SlotItem[] = [
  { id: "t1", name: "Cream knit tee" },
  { id: "t2", name: "Navy striped oxford" },
  { id: "t3", name: "Lilac cardigan" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="gutter type-title-sm">{title}</h2>
      {children}
    </section>
  );
}

export function Gallery() {
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [score, setScore] = useState(82);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <Section title="Buttons">
        <div className="gutter flex flex-col gap-3">
          <Button block>Wear this</Button>
          <Button block variant="secondary" icon="shuffle">
            Shuffle
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost">Skip</Button>
            <Button variant="destructive">Delete</Button>
            <Button loading loadingLabel="Saving...">
              Save
            </Button>
          </div>
          <div className="flex gap-2">
            <IconButton icon="search" label="Search" />
            <IconButton icon="filter" label="Filter" variant="tonal" />
            <IconButton icon="plus" label="Add item" variant="primary" />
          </div>
        </div>
      </Section>

      <Section title="Chips">
        <ChipRow label="Category">
          <Chip variant="filter" icon="filter" count={2}>
            Filter
          </Chip>
          {["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes"].map((c) => (
            <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </ChipRow>
        <div className="gutter flex flex-wrap gap-2">
          <Chip swatch="#1f3a6b">Navy</Chip>
          <TagChip onRemove={() => {}}>vintage</TagChip>
        </div>
      </Section>

      <Section title="Badges">
        <div className="gutter flex flex-wrap gap-2">
          <StatusBadge status="clean" />
          <StatusBadge status="laundry" />
          <StatusBadge status="stored" />
          <Badge tone="draft">Needs tags</Badge>
          <Badge tone="info">6 drafts</Badge>
        </div>
      </Section>

      <Section title="Item cards">
        <div className="gutter grid grid-cols-2 gap-3">
          <ItemCard name="Navy striped oxford" meta="Worn 4 times" status="laundry" />
          <ItemCard name="Untagged photo" draft selectable selected={selected} onClick={() => setSelected((s) => !s)} />
        </div>
      </Section>

      <Section title="Dress-up slot">
        <div className="gutter flex flex-col gap-3">
          <MatchBadge key={score} state={matchStateForScore(score)} score={score} />
          <div className="flex gap-2">
            {[82, 60, 35].map((s) => (
              <Chip key={s} selected={score === s} onClick={() => setScore(s)}>
                {s}%
              </Chip>
            ))}
          </div>
          <MatchBadge state="thinking" />
          <DressUpSlot label="Top" items={TOPS} />
          <DressUpSlot label="Outerwear" items={[]} optional onAdd={() => {}} />
        </div>
      </Section>

      <Section title="Forms and banners">
        <div className="gutter flex flex-col gap-3">
          <TextField label="Name" placeholder="Navy striped oxford" />
          <TextField label="Brand" optional />
          <TextField label="Password" type="password" error="Check your password and sign in again." />
          <Banner tone="warning">You&apos;re offline. Changes will sync when you reconnect.</Banner>
          <Banner tone="error">That password didn&apos;t work. Try again.</Banner>
          <Banner tone="info">Finish tagging to use them in outfits</Banner>
          <div className="fc-toast">Saved to your closet</div>
        </div>
      </Section>

      <Section title="Window and progress">
        <div className="gutter flex flex-col gap-4">
          <WindowPanel title="Removing backgrounds 12/30">
            <Progress label="Removing backgrounds" value={40} />
          </WindowPanel>
          <WindowPanel title="Loading..." plain>
            <Progress label="Loading" />
          </WindowPanel>
        </div>
      </Section>

      <Section title="Overlays">
        <div className="gutter flex gap-2">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
          <Button variant="destructive-outline" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
        </div>
      </Section>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>
              Clear all
            </Button>
            <Button onClick={() => setSheetOpen(false)}>Apply</Button>
          </>
        }
      >
        <p className="type-body text-ink-muted">Sheet content goes here. Drag the handle down, tap the scrim, or press Escape to close.</p>
      </BottomSheet>

      <ConfirmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Delete this item?"
        description="It will also be removed from 2 saved outfits. Your wear history stays."
        actions={
          <>
            <Button variant="destructive" block onClick={() => setDialogOpen(false)}>
              Delete item
            </Button>
            <Button variant="ghost" block onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </>
        }
      />
    </div>
  );
}
