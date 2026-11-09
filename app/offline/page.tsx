import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon name="wifiOff" size={40} className="text-lavender-500" />
      <h1 className="type-title-md">You&apos;re offline</h1>
      <p className="type-body text-ink-muted">Reconnect to the internet to use Fit Check.</p>
    </main>
  );
}
