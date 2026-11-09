/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
"use client";

import { useState, useTransition } from "react";

import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Icon, Sparkle } from "@/components/ui/icon";
import { StarRating } from "@/components/ui/star-rating";
import { localIsoDate, wearDayTitle } from "@/lib/outfits/dates";
import { useLocalToday } from "@/lib/ui/use-local-today";

import { deleteOutfit, setWearRating, wearOutfit } from "../actions";

type WearTodayButtonProps = { id: string; lastWornOn: string | null; thumbs: string[] };

export function WearTodayButton({ id, lastWornOn, thumbs }: WearTodayButtonProps) {
  const today = useLocalToday();
  const [log, setLog] = useState<{ id: string; rating: number | null; day: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const wornToday = today !== null && (lastWornOn === today || log?.day === today);

  function wear() {
    const day = localIsoDate();
    setError(null);
    startTransition(async () => {
      const result = await wearOutfit(id, day);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLog({ id: result.logId, rating: result.rating, day });
      setOpen(true);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Banner tone="error">{error}</Banner> : null}
      <Button block icon={wornToday ? "check" : undefined} loading={pending} loadingLabel="Logging..." onClick={wear}>
        {wornToday ? "Worn today" : "Wear today"}
      </Button>
      {log ? <WearSheet open={open} onClose={() => setOpen(false)} log={log} thumbs={thumbs} onRated={(rating) => setLog({ ...log, rating })} /> : null}
    </div>
  );
}

type WearSheetProps = {
  open: boolean;
  onClose: () => void;
  log: { id: string; rating: number | null; day: string };
  thumbs: string[];
  onRated: (rating: number | null) => void;
};

/** "Logged for today" confirmation with an optional rating (WearSheet.dc.html). */
function WearSheet({ open, onClose, log, thumbs, onRated }: WearSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function rate(rating: number | null) {
    const previous = log.rating;
    onRated(rating);
    setError(null);
    startTransition(async () => {
      const result = await setWearRating(log.id, rating);
      if (!result.ok) {
        onRated(previous);
        setError(result.error);
      }
    });
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Logged for today"
      footer={
        <Button block onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative flex flex-col items-center gap-2">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-mint-400 shadow-[0_0_0_3px_rgba(142,232,196,0.45),0_0_20px_rgba(142,232,196,0.9)]">
            <Icon name="check" size={28} />
          </span>
          <p className="type-caption">{wearDayTitle(log.day)}</p>
          <Sparkle size={18} className="absolute -top-1 -left-8 text-pink-400" />
          <Sparkle size={12} className="absolute top-8 -right-8 text-lavender-300" />
        </div>
        {thumbs.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {thumbs.slice(0, 4).map((src) => (
              <span key={src} className="fc-thumb !h-[76px] !w-[76px]">
                <img src={src} alt="" />
              </span>
            ))}
          </div>
        ) : null}
        <fieldset className="flex flex-col items-center gap-1">
          <legend className="mx-auto mb-1 type-body-strong">
            How much do you love it? <span className="type-caption">(optional)</span>
          </legend>
          <StarRating value={log.rating} onChange={rate} />
          <span className="type-pixel-sm text-ink-muted" aria-live="polite">
            {log.rating ? `${log.rating} of 5` : "Not rated"}
          </span>
        </fieldset>
        {error ? <Banner tone="error">{error}</Banner> : null}
      </div>
    </BottomSheet>
  );
}

type DeleteOutfitButtonProps = { id: string; title: string; timesWorn: number };

export function DeleteOutfitButton({ id, title, timesWorn }: DeleteOutfitButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const history = timesWorn ? " Your wear history keeps the days you wore it." : "";

  return (
    <>
      <IconButton icon="trash" label="Delete outfit" className="text-danger" onClick={() => setOpen(true)} />
      <ConfirmDialog
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Delete this outfit?"
        description={
          <p>
            {title} leaves your saved outfits. The pieces stay in your closet.{history}
          </p>
        }
        actions={
          <>
            <Button variant="destructive" block loading={pending} loadingLabel="Deleting..." onClick={() => startTransition(() => deleteOutfit(id))}>
              Delete
            </Button>
            <Button variant="secondary" block disabled={pending} onClick={() => setOpen(false)}>
              Keep it
            </Button>
          </>
        }
      />
    </>
  );
}
