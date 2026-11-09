import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getOutfit } from "@/lib/outfits/queries";

import { BuilderPage, BuilderSkeleton } from "../../builder-page";

export const metadata = { title: "Edit outfit" };

async function EditOutfitData({ params }: PageProps<"/outfits/[id]/edit">) {
  const { id } = await params;
  const outfit = await getOutfit(id);
  if (!outfit) notFound();
  return <BuilderPage outfit={outfit} />;
}

export default function EditOutfitPage(props: PageProps<"/outfits/[id]/edit">) {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <EditOutfitData {...props} />
    </Suspense>
  );
}
