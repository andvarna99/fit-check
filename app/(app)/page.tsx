import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function TodayPage() {
  return (
    <>
      <ScreenHeader
        title="Today"
        actions={
          <Link href="/settings" className="fc-iconbtn fc-iconbtn--tonal" aria-label="Settings">
            <Icon name="settings" />
          </Link>
        }
      />
      <p className="gutter type-body text-ink-muted">Weather and outfit suggestions will appear here.</p>
    </>
  );
}
