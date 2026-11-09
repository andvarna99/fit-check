/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";
import { categoryLine } from "@/lib/closet/options";
import { imageSrc } from "@/lib/images/url";
import { wornSummary } from "@/lib/outfits/format";
import { getOutfit, type OutfitSummary } from "@/lib/outfits/queries";
import { OCCASION_LABEL, SLOT_LABEL } from "@/lib/outfits/slots";

import { DeleteOutfitButton, WearTodayButton } from "./outfit-controls";

export const metadata = { title: "Outfit" };

function Detail({ outfit }: { outfit: OutfitSummary }) {
  const title = outfit.name ?? "Untitled outfit";
  const thumbs = outfit.pieces.map((p) => imageSrc(p.thumbUrl ?? p.imageUrl));

  return (
    <div className="flex min-h-dvh flex-col">
      <BarHeader
        title=""
        start={
          <Link href="/outfits" className="fc-iconbtn" aria-label="Back to outfits">
            <Icon name="left" />
          </Link>
        }
        end={
          <span className="flex">
            <Link href={`/outfits/${outfit.id}/edit`} className="fc-iconbtn" aria-label="Edit outfit">
              <Icon name="pencil" />
            </Link>
            <DeleteOutfitButton id={outfit.id} title={title} timesWorn={outfit.timesWorn} />
          </span>
        }
      />

      <div className="gutter flex flex-col gap-1.5">
        <h1 className="type-title-lg">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {outfit.occasion ? <Badge tone="info">{OCCASION_LABEL[outfit.occasion]}</Badge> : null}
          <span className="type-caption">{wornSummary(outfit.timesWorn, outfit.lastWornOn)}</span>
        </div>
      </div>

      <ul className="gutter mt-4 flex flex-1 flex-col gap-2">
        {outfit.pieces.length === 0 ? (
          <li className="type-body text-ink-muted">Every piece in this outfit has left your closet. Edit it to add new ones.</li>
        ) : null}
        {outfit.pieces.map((p, i) => {
          const name = p.name ?? categoryLine(p.category, p.subcategory);
          return (
            <li key={p.id}>
              <Link href={`/closet/${p.id}`} className="fc-slot flex items-center gap-3.5 !py-2 pr-3.5 pl-2">
                <span className="fc-thumb !h-[72px] !w-[72px] !shadow-none">
                  {thumbs[i] ? <img src={thumbs[i] ?? undefined} alt="" /> : <Icon name="hanger" className="text-lavender-300" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="type-pixel-sm text-ink-muted">{SLOT_LABEL[p.slot]}</span>
                  <span className="truncate type-body-strong">{name}</span>
                </span>
                <Icon name="right" size={20} className="text-ink-muted" />
                <span className="sr-only">Open {name}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {outfit.pieces.length ? (
        <div className="fc-actionbar">
          <WearTodayButton id={outfit.id} lastWornOn={outfit.lastWornOn} thumbs={thumbs.filter((t): t is string => !!t)} />
        </div>
      ) : null}
    </div>
  );
}

async function OutfitData({ params }: PageProps<"/outfits/[id]">) {
  const { id } = await params;
  const outfit = await getOutfit(id);
  if (!outfit) notFound();
  return <Detail outfit={outfit} />;
}

export default function OutfitPage(props: PageProps<"/outfits/[id]">) {
  return (
    <Suspense fallback={<div className="gutter pt-16" aria-busy="true"><div className="h-80 animate-pulse rounded-[var(--radius-md)] bg-surface-100" /></div>}>
      <OutfitData {...props} />
    </Suspense>
  );
}
