import { ImageResponse } from "next/og";

/** Placeholder app icon until the designed icon is ready. */
export function renderAppIcon(size: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #93c5fd 100%)",
          color: "#ffffff",
          fontSize: size * 0.42,
          fontWeight: 800,
          letterSpacing: -size * 0.02,
        }}
      >
        FC
      </div>
    ),
    { width: size, height: size },
  );
}
