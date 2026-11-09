import { notFound } from "next/navigation";
import { Suspense } from "react";

import { priceInputValue } from "@/lib/closet/format";
import { getItemDetail } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";

import { EditItemForm } from "./edit-item-form";

export const metadata = { title: "Edit item" };

/** Only the bulk upload review may be a return target (prevents open redirects). */
function safeReturnTo(value: string | string[] | undefined): string | undefined {
  return value === "/closet/bulk" ? value : undefined;
}

async function EditData({ params, searchParams }: PageProps<"/closet/[id]/edit">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const item = await getItemDetail(id);
  if (!item) notFound();
  return (
    <EditItemForm
      id={item.id}
      isDraft={item.isDraft}
      returnTo={safeReturnTo(query.returnTo)}
      photoSrc={imageSrc(item.thumbUrl ?? item.imageUrl)}
      initial={{
        name: item.name ?? "",
        category: item.category,
        subcategory: item.subcategory ?? "",
        colors: item.colors,
        pattern: item.pattern ?? "",
        material: item.material ?? "",
        seasons: item.seasons,
        formality: item.formality,
        warmth: item.warmth,
        brand: item.brand ?? "",
        price: priceInputValue(item.priceCents),
        purchasedOn: item.purchasedOn ?? "",
        tags: item.tags,
      }}
    />
  );
}

export default function EditItemPage(props: PageProps<"/closet/[id]/edit">) {
  return (
    <Suspense fallback={<div className="gutter pt-16 type-body text-ink-muted" aria-busy="true">Loading…</div>}>
      <EditData {...props} />
    </Suspense>
  );
}
