import { SYMBOL } from "@/lib/brand-symbol";

/** Side of the square cloud-density texture, in px. The clouds are soft, so this is plenty at any size. */
export const SYMBOL_MASK_SIZE = 256;

/** Cloud strands are puffier than the logo's ink: the stroke is drawn this many times wider. */
export const CLOUD_STROKE_SCALE = 2;

/** Blur radius in symbol units, turning each strand's hard edge into a density falloff. */
export const CLOUD_SOFTNESS = 8;

/** Extra width of the cut where one strand passes over the other, so the gap survives the wider strokes. */
export const CLOUD_CUT = SYMBOL.cut + SYMBOL.stroke * (CLOUD_STROKE_SCALE - 1);
/** Radius of the clip around each crossing, grown with the strokes. */
export const CLOUD_CROSSING_RADIUS = SYMBOL.crossingRadius * 1.35;

export type SymbolMaskTransform = {
  /** Mask px per symbol unit. */
  scale: number;
  /** Translation for `setTransform(scale, 0, 0, scale, offsetX, offsetY)`. */
  offsetX: number;
  offsetY: number;
  /** Fraction of the mask's side that the symbol's artwork height covers. */
  coverage: number;
};

/**
 * Fits the symbol (its cropped viewBox) in the middle of a square mask, leaving room on every side for the
 * widened, blurred strands to spill past the artwork.
 */
export function symbolMaskTransform(size: number = SYMBOL_MASK_SIZE): SymbolMaskTransform {
  const { x, y, width, height } = SYMBOL.box;
  const spill = (SYMBOL.stroke * CLOUD_STROKE_SCALE) / 2 + CLOUD_SOFTNESS * 2;
  const span = height + spill * 2; // the symbol is taller than wide, so its height decides
  const scale = size / span;
  return {
    scale,
    offsetX: (size - width * scale) / 2 - x * scale,
    offsetY: (size - height * scale) / 2 - y * scale,
    coverage: height / span,
  };
}

/**
 * Draws the cloud-density mask: the S strand in the red channel and the D strand in the green, each widened,
 * cut where the other strand passes over it (as in the logo) and blurred into a soft falloff, on opaque
 * black. Keeping the strands apart lets the shader treat them as two cloud banks. Browser only; returns null
 * when a 2D context is not available.
 */
export function drawSymbolMask(doc: Document, size: number = SYMBOL_MASK_SIZE): HTMLCanvasElement | null {
  const canvas = doc.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const t = symbolMaskTransform(size);
  const s = new Path2D(SYMBOL.s);
  const d = new Path2D(SYMBOL.d);

  /** One strand on its own transparent layer, with the other strand's crossing cut out of it. */
  const strand = (path: Path2D, color: string, over: Path2D, at: { cx: number; cy: number }) => {
    const layer = doc.createElement("canvas");
    layer.width = size;
    layer.height = size;
    const g = layer.getContext("2d");
    if (!g) return layer;
    g.setTransform(t.scale, 0, 0, t.scale, t.offsetX, t.offsetY);
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = color;
    g.lineWidth = SYMBOL.stroke * CLOUD_STROKE_SCALE;
    g.stroke(path);
    g.save();
    g.beginPath();
    g.arc(at.cx, at.cy, CLOUD_CROSSING_RADIUS, 0, Math.PI * 2);
    g.clip();
    g.globalCompositeOperation = "destination-out";
    g.strokeStyle = "#000";
    g.lineWidth = CLOUD_CUT;
    g.stroke(over);
    g.restore();
    return layer;
  };

  const { overD, overS } = SYMBOL.crossings;
  // The D is cut where the S passes over it, and the S where the D passes over it.
  const layers = [strand(s, "#f00", d, overS), strand(d, "#0f0", s, overD)];

  // Opaque black first: the channels then hold the density directly, with no premultiplied alpha to undo.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "lighter";
  const blur = CLOUD_SOFTNESS * t.scale;
  if (typeof ctx.filter === "string") {
    ctx.filter = `blur(${blur.toFixed(2)}px)`;
    for (const layer of layers) ctx.drawImage(layer, 0, 0);
  } else {
    // No canvas filters (older Safari): a cheap blur from offset, faint copies.
    const taps = 12;
    ctx.globalAlpha = 1 / taps;
    for (const layer of layers) {
      for (let i = 0; i < taps; i++) {
        const a = (i / taps) * Math.PI * 2;
        ctx.drawImage(layer, Math.cos(a) * blur * 0.7, Math.sin(a) * blur * 0.7);
      }
    }
  }
  return canvas;
}
