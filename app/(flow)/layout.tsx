/** Pushed screens (item detail, add/edit flows): no tab bar, per the mockups. */
export default function FlowLayout({ children }: LayoutProps<"/">) {
  return <main className="safe-top mx-auto min-h-dvh w-full max-w-md">{children}</main>;
}
