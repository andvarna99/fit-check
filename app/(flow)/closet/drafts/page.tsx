import Link from "next/link";
import { Suspense } from "react";

import { Icon } from "@/components/ui/icon";
import { ItemCard } from "@/components/ui/item-card";
import { BarHeader } from "@/components/ui/screen-header";
import { listClosetItems } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";

export const metadata = { title: "Drafts" };

async function DraftsData() {
  const drafts = (await listClosetItems()).filter((i) => i.isDraft);
  if (drafts.length === 0) {
    return (
      <div className="gutter flex flex-col gap-2 pt-6">
        <h2 className="type-title-md">All tagged</h2>
        <p className="type-body text-ink-muted">No drafts left. Every piece is ready for outfits.</p>
      </div>
    );
  }
  return (
    <>
      <p className="gutter type-body text-ink-muted">
        {drafts.length} {drafts.length === 1 ? "item needs" : "items need"} tags. Tap one to finish it.
      </p>
      <ul className="gutter mt-4 grid grid-cols-3 gap-2 pb-10">
        {drafts.map((d) => (
          <li key={d.id} className="min-w-0">
            <ItemCard href={`/closet/${d.id}/edit`} src={imageSrc(d.thumbUrl ?? d.imageUrl)} draft name={d.name} />
          </li>
        ))}
      </ul>
    </>
  );
}

export default function DraftsPage() {
  return (
    <>
      <BarHeader
        title="Drafts"
        start={
          <Link href="/closet" className="fc-iconbtn" aria-label="Back to closet">
            <Icon name="left" />
          </Link>
        }
      />
      <Suspense fallback={<p className="gutter type-body text-ink-muted">Loading drafts…</p>}>
        <DraftsData />
      </Suspense>
    </>
  );
}
