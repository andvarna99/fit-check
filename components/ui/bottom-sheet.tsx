"use client";

import { useId, useRef, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

import { IconButton } from "./button";
import { useModal } from "./use-modal";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Pinned action row, e.g. Clear all / Apply. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

const DISMISS_DRAG_PX = 80;

/** Modal sheet. Closes on scrim tap, Escape, the close button, or a downward drag on the handle area. */
export function BottomSheet({ open, onClose, title, footer, className, children }: BottomSheetProps) {
  const panelRef = useModal(open, onClose);
  const titleId = useId();
  const dragStartY = useRef<number | null>(null);

  if (!open || typeof document === "undefined") return null;

  function onPointerDown(event: PointerEvent) {
    dragStartY.current = event.clientY;
  }

  function onPointerUp(event: PointerEvent) {
    if (dragStartY.current === null) return;
    const dy = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (dy > DISMISS_DRAG_PX) onClose();
  }

  return createPortal(
    <div className="fc-sheet-wrap">
      <div className="fc-scrim" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className={cn("fc-sheet", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex flex-col" onPointerDown={onPointerDown} onPointerUp={onPointerUp} style={{ touchAction: "none" }}>
          <span className="fc-sheet__grab" aria-hidden />
          <header className="fc-sheet__head">
            <h2 id={titleId} className="fc-sheet__title">
              {title}
            </h2>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>
        </div>
        <div className="fc-sheet__body">{children}</div>
        {footer ? <footer className="fc-sheet__foot">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
