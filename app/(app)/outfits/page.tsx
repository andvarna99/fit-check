import { PageShell } from "@/components/layout/page-shell";

export const metadata = { title: "Outfits" };

export default function OutfitsPage() {
  return (
    <PageShell title="Outfits">
      <p className="text-neutral-600">Saved outfits will appear here.</p>
    </PageShell>
  );
}
