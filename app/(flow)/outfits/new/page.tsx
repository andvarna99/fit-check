import { Suspense } from "react";

import { BuilderPage, BuilderSkeleton } from "../builder-page";

export const metadata = { title: "New outfit" };

export default function NewOutfitPage() {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderPage outfit={null} />
    </Suspense>
  );
}
