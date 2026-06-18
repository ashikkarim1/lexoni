import { ImageResponse } from "next/og";

/**
 * Open Graph / Twitter card image. Generated at build time, served from
 * Vercel's edge cache. Replaces the previously-missing /og.png reference.
 *
 * 1200x630 is the canonical OG size and what Facebook, LinkedIn, X,
 * Slack, Discord, WhatsApp and iMessage all preview at.
 */
export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Lexoni.ai - The GCC Legal Operating System";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0b1220 0%, #1e1b4b 60%, #312e81 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: 80,
          justifyContent: "space-between",
        }}
      >
        {/* Top row: logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "white",
              color: "#0b1220",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>Lexoni.ai</div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            The GCC Legal Operating System.
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#cbd5e1",
              fontWeight: 400,
              lineHeight: 1.4,
              maxWidth: 980,
            }}
          >
            Outcome-driven matters. Regulator-mapped workflows. Bilingual EN and AR. Built in Dubai for the region.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <span>UAE</span>
            <span>·</span>
            <span>KSA</span>
            <span>·</span>
            <span>ADGM</span>
            <span>·</span>
            <span>DIFC</span>
            <span>·</span>
            <span>ADX</span>
            <span>·</span>
            <span>Tadawul</span>
          </div>
          <div style={{ fontWeight: 600, color: "white" }}>lexoni.ai</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
