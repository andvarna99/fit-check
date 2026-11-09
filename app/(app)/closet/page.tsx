import { PageShell } from "@/components/layout/page-shell";

export const metadata = { title: "Closet" };

export default function ClosetPage() {
  return (
    <PageShell title="Closet">
      <p className="text-neutral-600">Your clothing items will appear here.</p>
    </PageShell>
  );
}
