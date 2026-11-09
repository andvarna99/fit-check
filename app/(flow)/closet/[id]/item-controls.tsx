/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
"use client";

import { useOptimistic, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { ITEM_STATUSES, STATUS_LABEL, type ItemStatus } from "@/lib/closet/options";

import { deleteItem, setItemStatus } from "../actions";

const statusOptions = ITEM_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }));

export function StatusControl({ id, status }: { id: string; status: ItemStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, startTransition] = useTransition();
  return (
    <Segmented
      label="Status"
      options={statusOptions}
      value={optimistic}
      onChange={(next) => {
        if (!next || next === optimistic) return;
        startTransition(async () => {
          setOptimistic(next);
          await setItemStatus(id, next);
        });
      }}
    />
  );
}

type DeleteItemButtonProps = {
  id: string;
  title: string;
  subcategory: string | null;
  outfitCount: number;
  thumb: string | null;
};

export function DeleteItemButton({ id, title, subcategory, outfitCount, thumb }: DeleteItemButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const noun = subcategory ? subcategory.toLowerCase() : "item";
  const outfits = outfitCount ? ` and ${outfitCount} saved ${outfitCount === 1 ? "outfit" : "outfits"}` : "";

  return (
    <>
      <Button variant="destructive-outline" icon="trash" block onClick={() => setOpen(true)}>
        Delete item
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={`Delete this ${noun}?`}
        description={
          <div className="flex flex-col gap-3">
            {thumb ? (
              <span className="fc-thumb">
                <img src={thumb} alt="" />
              </span>
            ) : null}
            <p>
              {title} leaves your closet{outfits}. Your wear history keeps it. This can&apos;t be undone.
            </p>
          </div>
        }
        actions={
          <>
            <Button
              variant="destructive"
              block
              loading={pending}
              loadingLabel="Deleting..."
              onClick={() => startTransition(() => deleteItem(id))}
            >
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
