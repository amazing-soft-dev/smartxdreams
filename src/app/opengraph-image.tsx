import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { company } from "@/content/site";

// Static so the image is generated at build time and included in the static export.
export const dynamic = "force-static";
export const alt = `${company.name}: ${company.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The white mark for dark surfaces (1254 px square, transparent). The artwork fills only part of it
 * (x 198-1056, y 312-1057), so the card shows that box and crops the padding around it.
 */
const SYMBOL_FILE = path.join(process.cwd(), "public", "brand", "smartxdreams-white.png");
const SYMBOL_BOX = { size: 1254, x: 198, y: 312, width: 859, height: 746 } as const;
const SYMBOL_HEIGHT = 84;

/** Default social card: ink background, the brand symbol, the name and the tagline. */
export default async function OpenGraphImage() {
  const symbol = `data:image/png;base64,${(await readFile(SYMBOL_FILE)).toString("base64")}`;
  const scale = SYMBOL_HEIGHT / SYMBOL_BOX.height;
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
          <div
            style={{
              display: "flex",
              position: "relative",
              overflow: "hidden",
              width: Math.round(SYMBOL_BOX.width * scale),
              height: SYMBOL_HEIGHT,
            }}
          >
            <img
              src={symbol}
              alt=""
              width={Math.round(SYMBOL_BOX.size * scale)}
              height={Math.round(SYMBOL_BOX.size * scale)}
              style={{ position: "absolute", left: -Math.round(SYMBOL_BOX.x * scale), top: -Math.round(SYMBOL_BOX.y * scale) }}
            />
          </div>
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
