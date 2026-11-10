/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
"use client";

import { useState, useTransition } from "react";

import { setWearRating } from "@/app/(flow)/outfits/actions";
import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Icon, Sparkle } from "@/components/ui/icon";
import { StarRating } from "@/components/ui/star-rating";
import type { WeatherSnapshot } from "@/lib/db/schema";
import { wearDayTitle } from "@/lib/outfits/dates";
import { weatherLine } from "@/lib/outfits/weather";
import { useTempUnit } from "@/lib/weather/prefs";

type WearSheetProps = {
  open: boolean;
  onClose: () => void;
  log: { id: string; rating: number | null; day: string };
  thumbs: string[];
  /** Shown under the date, e.g. "64° partly cloudy". */
  weather?: WeatherSnapshot | null;
  onRated: (rating: number | null) => void;
};

/** "Logged for today" confirmation with an optional rating (WearSheet.dc.html). */
export function WearSheet({ open, onClose, log, thumbs, weather, onRated }: WearSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [unit] = useTempUnit();

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
          <p className="type-caption">
            {wearDayTitle(log.day)}
            {weather ? ` · ${weatherLine(weather, unit)}` : null}
          </p>
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
