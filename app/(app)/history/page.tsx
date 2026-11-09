import { PageShell } from "@/components/layout/page-shell";

export const metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <PageShell title="History">
      <p className="text-neutral-600">Your wear log will appear here.</p>
    </PageShell>
  );
}
