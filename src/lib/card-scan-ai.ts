/**
 * Server-side card reading via Claude Haiku 4.5 (src/app/api/scan-card/route.ts).
 * Optional and additive: card-ocr.ts's client-side tesseract.js pipeline stays
 * as the fallback whenever this fails or isn't configured, so scanning a card
 * never hard-depends on the API key being set.
 *
 * A single front photo is enough — Claude decides the text fields (including
 * every distinct phone number and email it finds, since real cards often
 * print more than one), an accent/surface colour pair with real contrast,
 * and (if the card has one) a bounding box around the actual logo mark, all
 * from that one image.
 */

export type LogoBox = { x: number; y: number; w: number; h: number };
export type LabeledValue = { label: string; value: string };

export type ClaudeScanFields = {
  lines: string[];
  full_name: string;
  headline: string;
  company: string;
  tagline: string;
  address: string;
  website: string;
  phones: LabeledValue[];
  emails: LabeledValue[];
  accent_color: string;
  surface_color: string;
  dark: boolean;
  vivid: boolean;
  logo_box: LogoBox | null;
};

export async function scanCardWithClaude(imageDataUrls: string[]): Promise<ClaudeScanFields | null> {
  try {
    const res = await fetch("/api/scan-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: imageDataUrls }),
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    if (!body?.ok || !body.fields) return null;
    return body.fields as ClaudeScanFields;
  } catch {
    return null;
  }
}

/** Median of a small numeric list — robust to the handful of outlier pixels
 *  a stray bit of the logo mark touching the crop's edge would contribute,
 *  in a way a mean wouldn't be. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Crops `box` (fractions of the image, from scan-card's logo_box) out of a
 * front-of-card image, then strips the surrounding card-background colour
 * out to transparency — turning a rectangular photo snippet into something
 * closer to an actual isolated logo asset. Works because a business card's
 * surface right around its logo is almost always one flat colour; this
 * samples that colour from the crop's own border pixels (a card-surface
 * assumption, not a photo-background one — the box itself is already
 * confined to the card, see scan-card's route.ts prompt) and keys it out.
 * `source` should be the same image logo_box was computed against.
 */
export async function cropLogo(source: Blob, box: LogoBox): Promise<string> {
  const bitmap = await createImageBitmap(source);
  // Generous padding beyond the model's box — its coordinates are a good
  // estimate, not a pixel-exact one, and are occasionally undersized. The
  // trim step at the end (not this padding) is what makes the final result
  // tight, so it's safe to pad generously here: enough room that the mark
  // is fully inside even when the model's box clipped part of it, plus a
  // reliable ring of true background for the colour-sampling step below.
  // A fixed pixel floor keeps this from collapsing to nothing on a tiny box.
  const padX = Math.max(box.w * 0.3, 20 / bitmap.width);
  const padY = Math.max(box.h * 0.3, 20 / bitmap.height);
  const sx = Math.max(0, Math.round((box.x - padX) * bitmap.width));
  const sy = Math.max(0, Math.round((box.y - padY) * bitmap.height));
  const sw = Math.min(bitmap.width - sx, Math.round((box.w + padX * 2) * bitmap.width));
  const sh = Math.min(bitmap.height - sy, Math.round((box.h + padY * 2) * bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, sw);
  canvas.height = Math.max(1, sh);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  bitmap.close?.();

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // Sample the border ring — for a tight-ish box this is mostly the card's
  // own flat surface colour, occasionally with a sliver of the mark itself
  // touching an edge, which the median below shrugs off.
  const borderPixels: [number, number, number][] = [];
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const i = (y * width + x) * 4;
      borderPixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, width - 1]) {
      const i = (y * width + x) * 4;
      borderPixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const bg: [number, number, number] = [
    median(borderPixels.map((p) => p[0])),
    median(borderPixels.map((p) => p[1])),
    median(borderPixels.map((p) => p[2])),
  ];

  // Key out anything close to the background colour, with a soft band so
  // the mark's edges anti-alias against transparency instead of leaving a
  // hard, jagged cutout line.
  const HARD = 26;
  const SOFT = 55;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let p = 0; p < data.length; p += 4) {
    const dr = data[p] - bg[0];
    const dg = data[p + 1] - bg[1];
    const db = data[p + 2] - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    let alpha: number;
    if (dist <= HARD) alpha = 0;
    else if (dist >= SOFT) alpha = 255;
    else alpha = Math.round(((dist - HARD) / (SOFT - HARD)) * 255);
    data[p + 3] = alpha;

    if (alpha > 10) {
      const pixelIndex = p / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Trim the now-transparent margin so the result is a tight cutout, not a
  // padded rectangle with empty space around the mark.
  if (maxX >= minX && maxY >= minY) {
    const trimW = maxX - minX + 1;
    const trimH = maxY - minY + 1;
    const trimmed = document.createElement("canvas");
    trimmed.width = trimW;
    trimmed.height = trimH;
    trimmed.getContext("2d")!.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
    return canvasToDataUrl(trimmed);
  }
  return canvasToDataUrl(canvas);
}

function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("crop failed"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}
