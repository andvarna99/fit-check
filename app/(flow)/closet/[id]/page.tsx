/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { StatusBadge } from "@/components/ui/badge";
import { TagChip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { BarHeader } from "@/components/ui/screen-header";
import { costPerWearCents, formatDate, formatPrice } from "@/lib/closet/format";
import { COLOR_BY_NAME, SEASON_LABEL, categoryLine, type ColorName } from "@/lib/closet/options";
import { getItemDetail, type ItemDetail } from "@/lib/closet/queries";
import { imageSrc } from "@/lib/images/url";

import { DeleteItemButton, StatusControl } from "./item-controls";

export const metadata = { title: "Item" };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fc-li">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Dots({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="type-pixel-sm">{value}/5</span>
      <span className="fc-dots" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= value ? "is-on" : undefined} />
        ))}
      </span>
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="fc-stat">
      <p className="fc-stat__value">{value}</p>
      <p className="type-caption">{label}</p>
    </div>
  );
}

function Detail({ item }: { item: ItemDetail }) {
  const cpw = costPerWearCents(item.priceCents, item.timesWorn);
  const title = item.name ?? categoryLine(item.category, item.subcategory);
  const details: Array<[string, ReactNode]> = [];
  if (item.colors.length)
    details.push([
      "Colors",
      item.colors.map((c) => {
        const color = COLOR_BY_NAME[c as ColorName];
        return color ? (
          <span key={c} className="fc-swatch-dot" style={{ background: color.swatch }} title={color.label}>
            <span className="sr-only">{color.label}</span>
          </span>
        ) : (
          <span key={c}>{c}</span>
        );
      }),
    ]);
  if (item.pattern) details.push(["Pattern", item.pattern]);
  if (item.material) details.push(["Material", item.material]);
  if (item.seasons.length) details.push(["Seasons", item.seasons.map((s) => SEASON_LABEL[s]).join(", ")]);
  if (item.formality) details.push(["Formality", <Dots key="f" value={item.formality} />]);
  if (item.warmth) details.push(["Warmth", <Dots key="w" value={item.warmth} />]);
  if (item.brand) details.push(["Brand", item.brand]);
  if (item.priceCents !== null) details.push(["Price", formatPrice(item.priceCents)]);
  if (item.purchasedOn) details.push(["Purchased", formatDate(item.purchasedOn)]);
  if (item.tags.length) details.push(["Tags", item.tags.map((t) => <TagChip key={t}>{t}</TagChip>)]);

  return (
    <>
      <BarHeader
        title=""
        start={
          <Link href={item.isDraft ? "/closet/drafts" : "/closet"} className="fc-iconbtn" aria-label="Back to closet">
            <Icon name="left" />
          </Link>
        }
        end={
          <Link href={`/closet/${item.id}/edit`} className="fc-btn fc-btn--ghost fc-btn--sm">
            Edit
          </Link>
        }
      />
      <div className="gutter flex flex-col gap-5 pb-10">
        <div className="fc-card relative grid aspect-square place-items-center overflow-hidden p-6">
          {item.imageUrl ? (
            <img src={imageSrc(item.imageUrl) ?? undefined} alt={title} className="h-full w-full object-contain" />
          ) : (
            <Icon name="hanger" size={64} className="text-lavender-300" />
          )}
          <StatusBadge status={item.status} className="absolute top-3 left-3" />
        </div>

        <div>
          <h1 className="type-title-md">{title}</h1>
          <p className="type-body text-ink-muted">{categoryLine(item.category, item.subcategory)}</p>
        </div>

        <StatusControl id={item.id} status={item.status} />

        <div className="grid grid-cols-3 gap-2">
          <Stat value={`${item.timesWorn}x`} label="Times worn" />
          <Stat value={item.lastWornOn ? formatDate(item.lastWornOn, { year: false }) : "Never"} label="Last worn" />
          <Stat value={cpw === null ? "—" : formatPrice(cpw)} label="Cost per wear" />
        </div>

        {details.length ? (
          <section aria-labelledby="details-title" className="flex flex-col gap-3">
            <h2 id="details-title" className="type-title-sm">
              Details
            </h2>
            <dl className="fc-group">
              {details.map(([label, value]) => (
                <Row key={label} label={label}>
                  {value}
                </Row>
              ))}
            </dl>
          </section>
        ) : null}

        {item.outfits.length ? (
          <section aria-labelledby="outfits-title" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 id="outfits-title" className="type-title-sm">
                In {item.outfits.length} {item.outfits.length === 1 ? "outfit" : "outfits"}
              </h2>
              <Link href="/outfits" className="type-callout font-semibold text-lavender-700">
                See all
              </Link>
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {item.outfits.slice(0, 3).map((o) => (
                <li key={o.id}>
                  <Link href={`/outfits/${o.id}`} className="fc-collage" aria-label={o.name ?? "Outfit"}>
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i}>{o.thumbs[i] ? <img src={imageSrc(o.thumbs[i]) ?? undefined} alt="" /> : null}</span>
                    ))}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <DeleteItemButton id={item.id} title={title} subcategory={item.subcategory} outfitCount={item.outfits.length} thumb={imageSrc(item.thumbUrl)} />
      </div>
    </>
  );
}

async function ItemDetailData({ params }: PageProps<"/closet/[id]">) {
  const { id } = await params;
  const item = await getItemDetail(id);
  if (!item) notFound();
  return <Detail item={item} />;
}

export default function ItemDetailPage(props: PageProps<"/closet/[id]">) {
  return (
    <Suspense fallback={<div className="gutter pt-16" aria-busy="true"><div className="aspect-square animate-pulse rounded-[var(--radius-md)] bg-surface-100" /></div>}>
      <ItemDetailData {...props} />
    </Suspense>
  );
}
