/**
 * Reads a photographed business card into the fields the editor already
 * understands.
 *
 * Nothing here is trusted silently — every field carries the raw line it came
 * from, and the review screen (src/app/templates/scan/page.tsx) shows that
 * alongside an editable input rather than presenting a guess as fact.
 * Structured fields (email, phone, website) are found by pattern and are
 * reliable; name/headline/company are a size heuristic and are not — a
 * business card's layout is not standardised enough for anything better
 * without hand-labelled training data this project doesn't have.
 */

export type ScanLine = { text: string; height: number; confidence: number };

export type ScanFields = {
  full_name: ScanLine | null;
  headline: ScanLine | null;
  company: ScanLine | null;
  phone: ScanLine | null;
  email: ScanLine | null;
  website: ScanLine | null;
  /** Every line found, for a "nothing matched? here's everything we read"
   *  fallback in the review UI. */
  allLines: ScanLine[];
  /** False only when OCR itself failed (bad image, worker didn't load) —
   *  not when it simply found nothing to extract. */
  ok: boolean;
};

const EMPTY_FIELDS: ScanFields = {
  full_name: null,
  headline: null,
  company: null,
  phone: null,
  email: null,
  website: null,
  allLines: [],
  ok: false,
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const WEBSITE_RE = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?\b/i;
// At least 7 digits somewhere in the line, allowing the usual separators —
// loose on purpose, a false match just means one candidate line is skipped
// rather than a real phone number being missed.
const PHONE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/;

function looksLikeEmail(s: string) {
  return EMAIL_RE.test(s);
}
function looksLikePhone(s: string) {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && PHONE_RE.test(s);
}
function looksLikeWebsite(s: string) {
  // A bare email would also match a loose domain pattern — email is checked
  // first by the caller, so this only ever sees what's left.
  return WEBSITE_RE.test(s) && (s.includes(".") || /^www\./i.test(s));
}

/**
 * Grayscale + a contrast stretch across the image's own actual range.
 *
 * A phone photo of a card almost never has the flat, even lighting a scanner
 * would give it — a shadow from the hand holding it, a window behind,
 * overhead light hot-spotting the glossy bit. Stretching contrast to the
 * image's own min/max recovers text that a flat threshold would lose in the
 * darker corner, without touching hue at all (this never runs on the image
 * extractPalette reads — that one needs real colour).
 */
function contrastStretch(source: HTMLCanvasElement | ImageBitmap): HTMLCanvasElement {
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);

  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const gray = new Uint8ClampedArray(d.length / 4);
  let min = 255;
  let max = 0;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    gray[j] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const v = ((gray[j] - min) / range) * 255;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return canvas;
}

/** Same line, read twice — keep the more confident reading rather than one
 *  pass's guess winning just because it ran second. */
function mergeLines(a: ScanLine[], b: ScanLine[]): ScanLine[] {
  const byText = new Map<string, ScanLine>();
  for (const line of [...a, ...b]) {
    const key = line.text.toLowerCase();
    const existing = byText.get(key);
    if (!existing || line.confidence > existing.confidence) byText.set(key, line);
  }
  return [...byText.values()];
}

/**
 * Runs OCR on one or more card photos (front, optionally back) and merges
 * the results into one field set. `tesseract.js` is dynamically imported so
 * its ~2MB worker + traineddata never loads for anyone who doesn't use this
 * page.
 *
 * Each image is read twice — once as photographed, once contrast-stretched —
 * and the two readings are merged. Costs roughly double the time (a few
 * extra seconds, on an action someone does once), but the two passes fail on
 * different things: uneven lighting breaks the first, a card with almost no
 * colour contrast to begin with gains nothing from the second. Betting on
 * one guess was the gap a real photographed card exposed that a flat
 * synthetic test image never would.
 */
export async function scanCardText(images: (Blob | HTMLCanvasElement)[]): Promise<ScanFields> {
  if (!images.length) return EMPTY_FIELDS;

  let createWorker: typeof import("tesseract.js").createWorker;
  let PSM: typeof import("tesseract.js").PSM;
  try {
    ({ createWorker, PSM } = await import("tesseract.js"));
  } catch {
    return EMPTY_FIELDS;
  }

  const linesOf = async (
    data: Awaited<ReturnType<import("tesseract.js").Worker["recognize"]>>["data"]
  ): Promise<ScanLine[]> => {
    const out: ScanLine[] = [];
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          const text = line.text.trim();
          if (!text) continue;
          out.push({ text, height: line.bbox.y1 - line.bbox.y0, confidence: line.confidence });
        }
      }
    }
    return out;
  };

  let allLines: ScanLine[] = [];

  try {
    const worker = await createWorker("eng");
    try {
      // SPARSE_TEXT, not the default AUTO: Tesseract's default page
      // segmentation assumes a document — continuous paragraphs it can find
      // by looking for a text block. A card is the opposite of that, a few
      // short, unrelated lines scattered around a mostly-empty background,
      // which is exactly the layout SPARSE_TEXT is built to find.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });

      for (const image of images) {
        const { data: rawData } = await worker.recognize(image, {}, { blocks: true, text: true });
        const rawLines = await linesOf(rawData);

        const canvasImage =
          image instanceof HTMLCanvasElement ? image : await blobToCanvas(image);
        const stretched = contrastStretch(canvasImage);
        const { data: stretchedData } = await worker.recognize(
          stretched,
          {},
          { blocks: true, text: true }
        );
        const stretchedLines = await linesOf(stretchedData);

        allLines = mergeLines(allLines, mergeLines(rawLines, stretchedLines));
      }
    } finally {
      await worker.terminate();
    }
  } catch {
    return EMPTY_FIELDS;
  }

  // Structured fields first — reliable, and pulled out of the pool before the
  // size heuristic runs so a long email or phone line never gets mistaken
  // for the name just because it happens to render tall.
  const remaining = [...allLines];
  const take = (test: (s: string) => boolean): ScanLine | null => {
    const idx = remaining.findIndex((l) => test(l.text));
    if (idx === -1) return null;
    return remaining.splice(idx, 1)[0];
  };

  const email = take((s) => looksLikeEmail(s));
  const phone = take((s) => looksLikePhone(s));
  const website = take((s) => looksLikeWebsite(s));

  // What's left is free text — the tallest line is almost always the name on
  // a business card (it's the one thing every layout makes biggest), and the
  // next two (in size order) are offered as headline/company.
  const bySize = [...remaining].sort((a, b) => b.height - a.height);
  const full_name = bySize[0] ?? null;
  const headline = bySize[1] ?? null;
  const company = bySize[2] ?? null;

  return { full_name, headline, company, phone, email, website, allLines, ok: true };
}
