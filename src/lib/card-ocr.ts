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
 * Runs OCR on one or more card photos (front, optionally back) and merges
 * the results into one field set. `tesseract.js` is dynamically imported so
 * its ~2MB worker + traineddata never loads for anyone who doesn't use this
 * page.
 */
export async function scanCardText(images: (Blob | HTMLCanvasElement)[]): Promise<ScanFields> {
  if (!images.length) return EMPTY_FIELDS;

  let createWorker: typeof import("tesseract.js").createWorker;
  try {
    ({ createWorker } = await import("tesseract.js"));
  } catch {
    return EMPTY_FIELDS;
  }

  const allLines: ScanLine[] = [];

  try {
    const worker = await createWorker("eng");
    try {
      for (const image of images) {
        const { data } = await worker.recognize(image, {}, { blocks: true, text: true });
        for (const block of data.blocks ?? []) {
          for (const paragraph of block.paragraphs) {
            for (const line of paragraph.lines) {
              const text = line.text.trim();
              if (!text) continue;
              allLines.push({
                text,
                height: line.bbox.y1 - line.bbox.y0,
                confidence: line.confidence,
              });
            }
          }
        }
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
