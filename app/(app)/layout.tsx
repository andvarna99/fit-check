import { TabBar } from "@/components/ui/tab-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="safe-top screen-with-tabbar mx-auto w-full max-w-md">{children}</main>
      <TabBar />
    </>
  );
}
