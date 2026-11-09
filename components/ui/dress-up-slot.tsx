/* eslint-disable @next/next/no-img-element -- item photos are user uploads of unknown size */
"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@/lib/cn";
import { cycleIndex } from "@/lib/ui/carousel";

import { Icon } from "./icon";

export type SlotItem = { id: string; name?: string | null; src?: string | null };

type DressUpSlotProps = {
  /** Slot name, e.g. "Top". */
  label: string;
  items: SlotItem[];
  optional?: boolean;
  /** Controlled index. Omit to let the slot manage its own. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number, item: SlotItem) => void;
  /** Controlled lock state. Omit to let the slot manage its own. */
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  /** Optional slots with nothing chosen show a dashed "+ add" row that calls this. */
  onAdd?: () => void;
  className?: string;
};

const SWIPE_THRESHOLD_PX = 40;

export function DressUpSlot({
  label,
  items,
  optional,
  index: controlledIndex,
  defaultIndex = 0,
  onIndexChange,
  locked: controlledLocked,
  onLockedChange,
  onAdd,
  className,
}: DressUpSlotProps) {
  const [ownIndex, setOwnIndex] = useState(defaultIndex);
  const [ownLocked, setOwnLocked] = useState(false);
  const swipeStartX = useRef<number | null>(null);

  const count = items.length;
  const index = Math.min(controlledIndex ?? ownIndex, Math.max(count - 1, 0));
  const locked = controlledLocked ?? ownLocked;
  const current = items[index];
  const prev = count > 1 ? items[cycleIndex(index, -1, count)] : undefined;
  const next = count > 1 ? items[cycleIndex(index, 1, count)] : undefined;
  const canMove = !locked && count > 1;

  function go(delta: number) {
    if (!canMove) return;
    const nextIndex = cycleIndex(index, delta, count);
    if (controlledIndex === undefined) setOwnIndex(nextIndex);
    onIndexChange?.(nextIndex, items[nextIndex]);
  }

  function toggleLock() {
    if (controlledLocked === undefined) setOwnLocked(!locked);
    onLockedChange?.(!locked);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  }

  function onPointerDown(event: PointerEvent) {
    swipeStartX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent) {
    if (swipeStartX.current === null) return;
    const dx = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX) go(dx < 0 ? 1 : -1);
  }

  if (optional && count === 0 && onAdd) {
    return (
      <button type="button" className={cn("fc-slot-add", className)} onClick={onAdd}>
        <Icon name="plus" size={20} />
        Add {label.toLowerCase()}
      </button>
    );
  }

  const announcement = current
    ? `${label}, ${index + 1} of ${count}${current.name ? `, ${current.name}` : ""}${locked ? ", locked" : ""}`
    : `${label}, empty`;

  return (
    <section
      className={cn("fc-slot", locked && "is-locked", className)}
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <header className="fc-slot__head">
        <span className="fc-slot__label">
          {label}
          {optional ? <span className="fc-slot__opt"> optional</span> : null}
        </span>
        <span className="fc-slot__count" aria-hidden>
          {count ? `${index + 1}/${count}` : "0/0"}
        </span>
        <button
          type="button"
          className={cn("fc-lock", locked && "is-on")}
          aria-pressed={locked}
          aria-label={`Lock ${label}`}
          onClick={toggleLock}
        >
          <Icon name={locked ? "lock" : "unlock"} size={18} />
          {locked ? <span className="fc-lock__txt">Locked</span> : null}
        </button>
      </header>

      <div
        className="fc-slot__stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipeStartX.current = null)}
        style={{ touchAction: "pan-y" }}
      >
        <button type="button" className="fc-slot__nav" aria-label={`Previous ${label}`} onClick={() => go(-1)} disabled={!canMove}>
          <Icon name="left" />
        </button>
        <span className="fc-slot__peek">{prev?.src ? <img src={prev.src} alt="" /> : null}</span>
        <span className="fc-slot__main">
          {current ? (
            current.src ? (
              <img key={current.id} src={current.src} alt="" />
            ) : (
              <Icon name="hanger" size={48} className="text-lavender-300" />
            )
          ) : (
            <span className="fc-slot__empty">{optional ? "Tap + to add" : "Nothing fits yet"}</span>
          )}
        </span>
        <span className="fc-slot__peek">{next?.src ? <img src={next.src} alt="" /> : null}</span>
        <button type="button" className="fc-slot__nav" aria-label={`Next ${label}`} onClick={() => go(1)} disabled={!canMove}>
          <Icon name="right" />
        </button>
      </div>

      {current?.name ? <p className="fc-slot__name" aria-hidden>{current.name}</p> : null}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
