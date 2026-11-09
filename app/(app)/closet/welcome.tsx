import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { ScreenHeader } from "@/components/ui/screen-header";
import { WindowPanel } from "@/components/ui/window-panel";

/** A3: first run, nothing in the closet yet. */
export function ClosetWelcome() {
  return (
    <>
      <ScreenHeader title="Closet" meta="0 items" />
      <div className="gutter flex flex-col gap-6 pt-2">
        <WindowPanel title="Closet.exe" bodyClassName="p-0">
          <div className="fc-plaid h-3" aria-hidden />
          <div className="flex flex-col items-center gap-3 px-4 py-8">
            <div className="flex gap-3 text-lavender-300" aria-hidden>
              <Icon name="closet" size={36} />
              <Icon name="hanger" size={36} />
              <Icon name="outfits" size={36} />
            </div>
            <p className="type-pixel-sm text-ink-muted">0 items found</p>
          </div>
        </WindowPanel>
        <div className="flex flex-col gap-2">
          <h2 className="type-title-md">Your closet is empty. Let&apos;s fill it.</h2>
          <p className="type-body text-ink-muted">
            Snap a few pieces or upload a whole camera roll. You tag them, Fit Check styles them.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/closet/bulk" className="fc-btn fc-btn--primary fc-btn--block">
            <Icon name="images" size={20} />
            <span>Bulk upload</span>
          </Link>
          <Link href="/closet/new" className="fc-btn fc-btn--secondary fc-btn--block">
            <Icon name="camera" size={20} />
            <span>Add one item</span>
          </Link>
        </div>
      </div>
    </>
  );
}
