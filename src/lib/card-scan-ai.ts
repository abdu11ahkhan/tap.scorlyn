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

/**
 * Crops `box` (fractions of the image, from scan-card's logo_box) out of a
 * front-of-card image and returns it as a data URL — the actual logo mark,
 * not the whole card. `source` should be the same image logo_box was
 * computed against.
 */
export async function cropLogo(source: Blob, box: LogoBox): Promise<string> {
  const bitmap = await createImageBitmap(source);
  const sx = Math.round(box.x * bitmap.width);
  const sy = Math.round(box.y * bitmap.height);
  const sw = Math.max(1, Math.round(box.w * bitmap.width));
  const sh = Math.max(1, Math.round(box.h * bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  bitmap.close?.();

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
