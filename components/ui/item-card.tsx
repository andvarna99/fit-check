/* eslint-disable @next/next/no-img-element -- item photos are user uploads of unknown size; next/image comes with the upload pipeline */
import Link from "next/link";

import { cn } from "@/lib/cn";

import { Badge, StatusBadge, type ItemStatus } from "./badge";
import { Icon } from "./icon";

type ItemCardProps = {
  name?: string | null;
  meta?: string;
  /** Background-removed photo URL. Falls back to a hanger placeholder. */
  src?: string | null;
  status?: ItemStatus;
  draft?: boolean;
  /** Multi-select mode: shows a checkbox and uses aria-pressed. */
  selectable?: boolean;
  selected?: boolean;
  /** Renders a link when set, otherwise a button. */
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function ItemCard({ name, meta, src, status, draft, selectable, selected, href, onClick, className }: ItemCardProps) {
  // Clean is the default state, so only Laundry/Stored get a badge on cards.
  const showStatus = status && status !== "clean";

  const content = (
    <>
      <span className="fc-item__photo">
        {src ? (
          <img src={src} alt="" />
        ) : (
          <span className="fc-item__ph">
            <Icon name="hanger" size={32} />
          </span>
        )}
        {showStatus || draft ? (
          <span className="fc-item__badges">
            {showStatus ? <StatusBadge status={status} /> : null}
            {draft ? <Badge tone="draft">Needs tags</Badge> : null}
          </span>
        ) : null}
        {selectable ? (
          <span className="fc-item__check" aria-hidden>
            {selected ? <Icon name="check" size={16} /> : null}
          </span>
        ) : null}
      </span>
      {name ? <span className="fc-item__name">{name}</span> : <span className="sr-only">Untitled item</span>}
      {meta ? <span className="fc-item__meta">{meta}</span> : null}
    </>
  );

  const classes = cn("fc-item", selected && "is-selected", className);

  if (href && !selectable) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-pressed={selectable ? !!selected : undefined}
    >
      {content}
    </button>
  );
}
