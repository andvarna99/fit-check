/* eslint-disable @next/next/no-img-element -- ImageResponse renders plain <img> */
import { ImageResponse } from "next/og";

import { markSvg } from "./mark";

/** Full-bleed square PNG of the app mark, for apple-touch and manifest icons. */
export function renderAppIcon(size: number): ImageResponse {
  const src = `data:image/svg+xml;base64,${Buffer.from(markSvg(0)).toString("base64")}`;
  return new ImageResponse(<img src={src} width={size} height={size} alt="" />, {
    width: size,
    height: size,
  });
}
