export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="safe-area mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-neutral-600">Reconnect to the internet to use Fit Check.</p>
    </main>
  );
}
