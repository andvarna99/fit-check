import { Suspense } from "react";

import { listClosetItems } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";

import { DraftsView } from "./drafts-view";

export const metadata = { title: "Drafts" };

async function DraftsData() {
  const drafts = (await listClosetItems())
    .filter((i) => i.isDraft)
    .map((d) => ({ id: d.id, name: d.name, thumb: imageSrc(d.thumbUrl ?? d.imageUrl) }));
  return <DraftsView drafts={drafts} />;
}

export default function DraftsPage() {
  return (
    <Suspense fallback={<p className="gutter pt-16 type-body text-ink-muted">Loading drafts…</p>}>
      <DraftsData />
    </Suspense>
  );
}
