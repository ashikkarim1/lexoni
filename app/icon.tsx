import { ImageResponse } from "next/og";

/**
 * Dynamically generated favicon. Same look as public/icon.svg but rendered
 * to PNG so browsers without SVG-favicon support still see the brand mark.
 * Next.js routes this at /icon.
 */
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 32, height: 32 };

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "#0b1220",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          letterSpacing: -1,
          fontFamily: "system-ui, sans-serif",
          borderRadius: 8,
        }}
      >
        L
      </div>
    ),
    { ...size },
  );
}
