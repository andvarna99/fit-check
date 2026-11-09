"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ItemForm, type ItemFormValues } from "@/components/closet/item-form";
import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";

import { updateItem } from "../../actions";

type EditItemFormProps = {
  id: string;
  isDraft: boolean;
  photoSrc: string | null;
  initial: ItemFormValues;
};

export function EditItemForm({ id, isDraft, photoSrc, initial }: EditItemFormProps) {
  const router = useRouter();
  return (
    <ItemForm
      initial={initial}
      photoSrc={photoSrc}
      header={
        <BarHeader
          title={isDraft ? "Finish tagging" : "Edit item"}
          start={
            <Link href={`/closet/${id}`} className="fc-iconbtn" aria-label="Cancel editing">
              <Icon name="close" />
            </Link>
          }
        />
      }
      // Finished items can't go back to being drafts; drafts can stay drafts.
      draftLabel={isDraft ? "Keep as draft" : null}
      submit={(formData) => updateItem(id, formData)}
      onSaved={(result) => {
        router.replace(result.isDraft ? "/closet/drafts" : `/closet/${id}`);
        router.refresh();
      }}
    />
  );
}
