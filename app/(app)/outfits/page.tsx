import { ScreenHeader } from "@/components/ui/screen-header";

export const metadata = { title: "Outfits" };

export default function OutfitsPage() {
  return (
    <>
      <ScreenHeader title="Outfits" />
      <p className="gutter type-body text-ink-muted">Saved outfits will appear here.</p>
    </>
  );
}
