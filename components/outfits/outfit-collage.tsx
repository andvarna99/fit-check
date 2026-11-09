/* eslint-disable @next/next/no-img-element -- private photos served by /api/images */
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { imageSrc } from "@/lib/images/url";

type CollagePiece = { id: string; thumbUrl: string | null; imageUrl: string | null };

/** 2×2 thumbnail of an outfit's first four pieces. */
export function OutfitCollage({ pieces, className }: { pieces: CollagePiece[]; className?: string }) {
  return (
    <span className={cn("fc-collage", className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => {
        const piece = pieces[i];
        const src = piece ? imageSrc(piece.thumbUrl ?? piece.imageUrl) : null;
        return (
          <span key={piece?.id ?? `empty-${i}`}>
            {src ? (
              <img src={src} alt="" />
            ) : piece ? (
              <span className="grid h-full place-items-center text-lavender-300">
                <Icon name="hanger" size={24} />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
