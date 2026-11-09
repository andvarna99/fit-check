import { notFound } from "next/navigation";

import { ScreenHeader } from "@/components/ui/screen-header";

import { Gallery } from "./gallery";

export const metadata = { title: "Design system" };

/** Development-only component gallery for checking the design system on a phone. */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <ScreenHeader title="Components" meta="dev only" />
      <Gallery />
    </>
  );
}
