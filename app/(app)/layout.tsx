import { TabBar } from "@/components/navigation/tab-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="safe-area-top flex-1 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+1rem)]">
        {children}
      </main>
      <TabBar />
    </>
  );
}
