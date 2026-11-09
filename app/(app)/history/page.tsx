import { ScreenHeader } from "@/components/ui/screen-header";

export const metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <>
      <ScreenHeader title="History" />
      <p className="gutter type-body text-ink-muted">Your wear log will appear here.</p>
    </>
  );
}
