import { ImageResponse } from "next/og";
import { company } from "@/content/site";

// Static so the image is generated at build time and included in the static export.
export const dynamic = "force-static";
export const alt = `${company.name}: ${company.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card: ink background, the brand mark, the name and the tagline. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0F1226",
          color: "#FFFFFF",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -160,
            top: -160,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: "radial-gradient(closest-side, rgba(109,74,255,0.55), rgba(109,74,255,0))",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg viewBox="38 82 380 328" width="88" height="76">
            <rect x="38" y="82" width="253" height="254" rx="38" fill="#FFFFFF" />
            <circle cx="291" cy="283.5" r="126.5" fill="#6D4AFF" />
            <path d="M291 157A126.5 126.5 0 0 0 175.9 336H253A38 38 0 0 0 291 298Z" fill="#FF6B3D" />
          </svg>
          <div style={{ fontSize: 44, letterSpacing: -1 }}>{company.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2, maxWidth: 940 }}>{company.tagline}</div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }}>
            Six focused AI products. A person stays in charge.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
