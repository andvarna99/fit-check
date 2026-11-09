"use client";

import { useOptimistic, useState, useTransition } from "react";

import { deleteWearLog, setWearRating } from "@/app/(flow)/outfits/actions";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { RatingLabel, StarRating } from "@/components/ui/star-rating";

export function EntryRating({ id, rating }: { id: string; rating: number | null }) {
  const [optimistic, setOptimistic] = useOptimistic(rating);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 type-title-sm">Your rating</legend>
      <div className="flex items-center gap-2">
        <StarRating
          value={optimistic}
          onChange={(next) => {
            setError(null);
            startTransition(async () => {
              setOptimistic(next);
              const result = await setWearRating(id, next);
              if (!result.ok) setError(result.error);
            });
          }}
        />
        <RatingLabel value={optimistic} />
      </div>
      <p className="type-caption">Tap a star to change it. Tap it again to clear.</p>
      {error ? <Banner tone="error">{error}</Banner> : null}
    </fieldset>
  );
}

export function DeleteWearButton({ id, day }: { id: string; day: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button variant="destructive-outline" icon="trash" block onClick={() => setOpen(true)}>
        Delete entry
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Delete this entry?"
        description={<p>{day} comes off your history, and its pieces count one fewer wear. This can&apos;t be undone.</p>}
        actions={
          <>
            <Button variant="destructive" block loading={pending} loadingLabel="Deleting..." onClick={() => startTransition(() => deleteWearLog(id))}>
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
