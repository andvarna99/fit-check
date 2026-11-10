"use client";

import { useState, useTransition } from "react";

import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { WearSheet } from "@/components/outfits/wear-sheet";
import { localIsoDate } from "@/lib/outfits/dates";
import { useLocalToday } from "@/lib/ui/use-local-today";
import { useLoadedWeather } from "@/lib/weather/store";

import { deleteOutfit, wearOutfit } from "../actions";

type WearTodayButtonProps = { id: string; lastWornOn: string | null; thumbs: string[] };

export function WearTodayButton({ id, lastWornOn, thumbs }: WearTodayButtonProps) {
  const today = useLocalToday();
  // Weather is attached when Today already loaded it; this screen doesn't ask for location.
  const weather = useLoadedWeather();
  const [log, setLog] = useState<{ id: string; rating: number | null; day: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const wornToday = today !== null && (lastWornOn === today || log?.day === today);

  function wear() {
    const day = localIsoDate();
    setError(null);
    startTransition(async () => {
      const result = await wearOutfit(id, day, weather);
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
      {log ? <WearSheet open={open} onClose={() => setOpen(false)} log={log} thumbs={thumbs} weather={weather} onRated={(rating) => setLog({ ...log, rating })} /> : null}
    </div>
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
