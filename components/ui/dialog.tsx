"use client";

import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useModal } from "./use-modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** Action buttons, primary/destructive first. */
  actions: ReactNode;
};

/** Centered confirmation dialog for destructive actions (delete item, outfit, wear entry). */
export function ConfirmDialog({ open, onClose, title, description, actions }: ConfirmDialogProps) {
  const panelRef = useModal(open, onClose);
  const titleId = useId();
  const descriptionId = useId();

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fc-dialog-wrap">
      <div className="fc-scrim" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className="fc-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <h2 id={titleId} className="fc-dialog__title type-title-md">
          {title}
        </h2>
        {description ? (
          <div id={descriptionId} className="type-body text-ink-muted">
            {description}
          </div>
        ) : null}
        <div className="fc-dialog__actions">{actions}</div>
      </div>
    </div>,
    document.body,
  );
}
