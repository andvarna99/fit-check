import { ScreenHeader } from "@/components/ui/screen-header";

export const metadata = { title: "Closet" };

export default function ClosetPage() {
  return (
    <>
      <ScreenHeader title="Closet" />
      <p className="gutter type-body text-ink-muted">Your clothing items will appear here.</p>
    </>
  );
}
