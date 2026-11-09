import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";

export default function TodayPage() {
  return (
    <PageShell
      title="Today"
      actions={
        <Link href="/settings" className="min-h-11 content-center text-sm text-neutral-600">
          Settings
        </Link>
      }
    >
      <p className="text-neutral-600">Weather and outfit suggestions will appear here.</p>
    </PageShell>
  );
}
