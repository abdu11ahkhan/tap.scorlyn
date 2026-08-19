/**
 * What a photographed business card looks like, reduced to what a template
 * actually needs: one accent colour, one surface tone, and whether the card
 * reads dark or light, loud or quiet.
 *
 * Deliberately simple — a histogram over downsampled pixels, not a proper
 * clustering algorithm. A business card is mostly two or three flat colours
 * (paper/background, ink, maybe a logo accent), so a histogram finds the real
 * dominant colours without needing anything heavier.
 */

export type CardVibe = {
  accent: string;
  surface: string;
  dark: boolean;
  vivid: boolean;
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * `bitmap` should already be downscaled (see downscale() in
 * ImagePicker.tsx) — this resamples further to a tiny grid regardless, so
 * feeding it a full-resolution photo only wastes time, not accuracy.
 */
export function extractPalette(bitmap: ImageBitmap): CardVibe {
  const SIZE = 48;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { accent: "#7C3AED", surface: "#111111", dark: true, vivid: true };

  ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  // Bucket by coarse RGB so near-identical shades (JPEG noise, lighting
  // gradient across the card) collapse into the same bucket instead of each
  // counting as its own colour.
  const STEP = 24;
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  let sumL = 0;
  let sumS = 0;
  let n = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [, s, l] = rgbToHsl(r, g, b);
    sumL += l;
    sumS += s;
    n++;

    const key = `${Math.round(r / STEP)},${Math.round(g / STEP)},${Math.round(b / STEP)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n++;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n);
  const avg = (bucket: { r: number; g: number; b: number; n: number }) => ({
    r: bucket.r / bucket.n,
    g: bucket.g / bucket.n,
    b: bucket.b / bucket.n,
  });

  // The most common colour is almost always the card's paper or background —
  // that becomes the surface tone. The accent is the most common colour after
  // it that reads as actually distinct (not just a lighting gradient on the
  // same background), found by requiring real hue or lightness separation.
  const surfaceBucket = ranked[0] ?? { r: 245, g: 245, b: 245, n: 1 };
  const surfaceAvg = avg(surfaceBucket);
  const [, , surfaceL] = rgbToHsl(surfaceAvg.r, surfaceAvg.g, surfaceAvg.b);

  let accentAvg = surfaceAvg;
  for (const bucket of ranked.slice(1)) {
    const a = avg(bucket);
    const [, aS, aL] = rgbToHsl(a.r, a.g, a.b);
    const distinct = Math.abs(aL - surfaceL) > 0.18 || aS > 0.25;
    if (distinct) {
      accentAvg = a;
      break;
    }
  }

  const avgLightness = sumL / n;
  const avgSaturation = sumS / n;

  return {
    accent: hex(accentAvg.r, accentAvg.g, accentAvg.b),
    surface: hex(surfaceAvg.r, surfaceAvg.g, surfaceAvg.b),
    dark: avgLightness < 0.5,
    vivid: avgSaturation > 0.28,
  };
}

/**
 * Which existing template component reads best with an arbitrary
 * photo-derived accent/surface pair.
 *
 * Not a search over all 36 — most of those are built around a fixed gallery
 * or cover photo and would look broken with no content in those slots. This
 * is a short, hand-picked list of templates that are primarily accent-colour
 * driven and hold up with any palette.
 */
export function suggestTemplate(vibe: Pick<CardVibe, "dark" | "vivid">): string {
  if (vibe.dark && vibe.vivid) return "neon";
  if (vibe.dark && !vibe.vivid) return "glass";
  if (!vibe.dark && vibe.vivid) return "sticker";
  return "minimal";
}
