import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5";
const MAX_IMAGES = 2;
const MAX_ENTRIES = 6;

const TEXT_KEYS = ["full_name", "headline", "company", "tagline", "address", "website"] as const;
type TextKey = (typeof TEXT_KEYS)[number];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export type LogoBox = { x: number; y: number; w: number; h: number };
export type LabeledValue = { label: string; value: string };

export type ClaudeCardFields = Record<TextKey, string> & {
  lines: string[];
  phones: LabeledValue[];
  emails: LabeledValue[];
  accent_color: string;
  surface_color: string;
  dark: boolean;
  vivid: boolean;
  logo_box: LogoBox | null;
};

// One photo (the front) is enough — Claude decides everything from it: the
// text fields, a colour pair with real contrast against each other, and
// where the logo mark sits so the client can crop it out. A back photo, if
// given, only ever adds text fields — colour and logo always come from the
// first image.
//
// Real cards are messy in ways a clean synthetic test card isn't: multiple
// phone numbers (landline vs. mobile, often unlabeled or icon-only), a full
// multi-line postal address, a tagline/slogan near the logo distinct from
// both the person's title and the company name, fields identified only by a
// small icon rather than a text label. All of that is named explicitly below
// instead of assumed away.
const SYSTEM_PROMPT = `You read a photographed business card (front, and optionally back) and extract everything needed to build a digital card from it.
Respond with ONLY a single JSON object, no markdown fences, no commentary. Shape:
{"lines":[""],"full_name":"","headline":"","company":"","tagline":"","address":"","website":"","phones":[{"label":"","value":""}],"emails":[{"label":"","value":""}],"accent_color":"#000000","surface_color":"#000000","dark":false,"vivid":false,"logo_box":null}

Work in two passes, in this order:

PASS 1 — transcribe. Fill "lines" first: one array entry per distinct line or text element on the card, in natural reading order (top to bottom, left to right within a row), copied EXACTLY as printed — same spelling, same capitalisation, same punctuation, same digit grouping. Do not correct typos, do not expand abbreviations, do not merge two separate printed lines into one entry, do not skip anything no matter how small (labels like "Tel:", "Cell:", "Email:" are their own signal — keep them attached to the number/address that follows on the same printed line if that's how the card prints it). This is a transcription step, not an interpretation step.

Some photos are rotated, glare-lit, low-resolution, or otherwise hard to read cleanly. When part of the image is genuinely hard to make out:
- Look harder at that specific region before giving up — use surrounding context (font, spacing, nearby digits) to resolve an ambiguous character, the way a careful human proofreader would.
- If, after that, a character is still truly ambiguous, transcribe your single best reading of it — do not swap in a different, rounder-looking, more "typical" value instead of what's actually printed.
- Never substitute a generic template/placeholder-style value (things like "555.555.9999", "123-456-7890", "name@website.com", "yourwebsite.com", "info@company.com") unless that literal text is what's printed. A card looking like a design template is not license to fill in template-looking answers — read the specific pixels in front of you every time, including on cards that resemble mockups or stock designs.
- If an entire line is too degraded to read at all, omit it from "lines" rather than inventing a plausible one. A missing line is honest; a wrong line is not.

PASS 2 — classify. Fill every field below using text copied VERBATIM from the "lines" you just transcribed — never paraphrase, never invent, never guess a value that isn't literally one of your transcribed lines (trimming a "Tel:"/"Cell:" prefix before putting the number in phones is fine; inventing new content is not). If a field isn't printed anywhere in "lines", leave it "" or [].

Text fields (use "" if not printed on the card, never invent a value):
- full_name: the person's name as printed.
- headline: their job title/role, if shown (e.g. "Marketing Manager").
- company: the organisation/business name, if shown — the name of the business, not a slogan.
- tagline: a short slogan or "we do X" line near the logo or company name, if the card has one (e.g. "Deals in all kinds of properties", "Estate and Builders") — distinct from company and headline, not always present.
- address: the full postal address as printed, joined into one line with commas (e.g. "G N-7 Gulberg Arcade Plaza, Main Market Gulberg 2, Lahore"). Combine every address line you can find; don't drop any part of it.
- website: the domain or URL, if shown, without a leading "https://".

Every phone number, email, and website printed on the card MUST end up in "phones", "emails", or "website" — a line that's clearly a number or address is never left out just because its prefix is unfamiliar. Recognise ALL of these forms, not only full words: a bare "Tel:"/"Cell:"/"Mobile:"/"Office:"/"Fax:"/"WhatsApp:", a single-letter prefix ("P:", "T:", "M:", "C:", "E:", "W:" — Phone/Tel/Mobile/Cell/Email/Web), an icon with no text at all (phone handset = call, mobile outline = cell, fax machine = fax, envelope = email, globe = website), or no prefix at all (a line that's just digits in phone-number shape, or contains "@", or ends in a domain like ".com" — those are a phone/email/website by shape alone, prefix or not).

Phone numbers — cards very often print more than one (landline/office, mobile/cell, fax, WhatsApp):
- phones: an array with one entry per DISTINCT phone number found, in reading order. Each entry: {"label": short tag if the card gives or implies one, else "", "value": the number itself — strip any "Tel:"/"P:"-style prefix, keep only the number}.
- Use labels like "Tel", "Cell", "Mobile", "Office", "Fax", "WhatsApp" only when the card actually labels or icons that number that way; otherwise use "".
- Never merge two different numbers into one entry, and never invent a second number that isn't printed.

Emails — most cards have one, but list every distinct address found:
- emails: an array of {"label": "", "value": "the address, with any "Email:"/"E:"-style prefix stripped"} — label only if the card distinguishes multiple (rare).

The photo is of a physical card photographed on some surface — a desk, a mousepad, a keyboard, someone's hand — and that surface is often visible around the card's edges, sometimes with its own texture, pattern, brand logo, or text (a mousepad's own logo, wood grain, fabric weave). None of that is part of the card. Before judging colour or logo, locate the card itself: the printed rectangular surface with the person's text on it. Everything below (colour, logo_box) must come from strictly inside that rectangle — never from the surrounding background, no matter how graphic or logo-like the background itself looks.

Colour, judged from the FIRST image only, and only from the card's own printed surface (never the background it's sitting on):
- accent_color: the card's real brand/ink colour as a hex code — the colour that would make buttons and links, not just any pixel colour.
- surface_color: the card's background tone as a hex code.
- accent_color and surface_color must have real contrast against each other (not near-identical) — pick colours that would actually be readable stacked on top of each other.
- dark: true if the card's overall background reads as dark, false if light.
- vivid: true if the card's colours are saturated/bold, false if muted/neutral.

Logo, judged from the FIRST image only, and only from the card's own printed surface:
- logo_box: if the card ITSELF has a distinct printed logo mark (a graphic symbol, not just text in a stylised font, and not anything belonging to the surface behind the card), the bounding box around ONLY that mark, as fractions of the first image's width/height: {"x":0-1,"y":0-1,"w":0-1,"h":0-1} where x,y is the top-left corner. Keep it tight — just the mark, not surrounding whitespace or nearby text, and never extending past the card's own edge.
- If there is no distinct logo mark printed on the card, or you aren't confident, or the only graphic mark you can see belongs to the background/surface rather than the card, set logo_box to null. Do not guess, and do not substitute a background element for a missing logo.`;

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mediaType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  return { mediaType, data: match[2] };
}

function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clamp01(n: unknown): number | null {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(1, v));
}

function coerceLogoBox(raw: unknown): LogoBox | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const x = clamp01(source.x);
  const y = clamp01(source.y);
  const w = clamp01(source.w);
  const h = clamp01(source.h);
  if (x === null || y === null || w === null || h === null) return null;
  // A box covering (almost) the whole card is the model describing the
  // whole photo, not a logo mark — treat it as "no logo" rather than crop
  // to something meaningless.
  if (w < 0.02 || h < 0.02 || w * h > 0.85) return null;
  return { x, y, w, h };
}

function coerceLabeledList(raw: unknown): LabeledValue[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: LabeledValue[] = [];
  for (const item of raw) {
    if (out.length >= MAX_ENTRIES) break;
    const source = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
    const value = typeof source?.value === "string" ? source.value.trim() : typeof item === "string" ? item.trim() : "";
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const label = typeof source?.label === "string" ? source.label.trim() : "";
    out.push({ label, value });
  }
  return out;
}

function coerceFields(raw: unknown): ClaudeCardFields {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const text = {} as Record<TextKey, string>;
  for (const key of TEXT_KEYS) {
    const value = source[key];
    text[key] = typeof value === "string" ? value.trim() : "";
  }
  const accent = typeof source.accent_color === "string" && HEX_RE.test(source.accent_color) ? source.accent_color : "";
  const surface = typeof source.surface_color === "string" && HEX_RE.test(source.surface_color) ? source.surface_color : "";
  const lines = Array.isArray(source.lines)
    ? source.lines.filter((l): l is string => typeof l === "string" && l.trim() !== "")
    : [];
  return {
    ...text,
    lines,
    phones: coerceLabeledList(source.phones),
    emails: coerceLabeledList(source.emails),
    accent_color: accent,
    surface_color: surface,
    dark: source.dark === true,
    vivid: source.vivid === true,
    logo_box: coerceLogoBox(source.logo_box),
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Card scanning isn't configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const images = Array.isArray(body?.images) ? (body.images as unknown[]) : [];
  if (images.length === 0) {
    return NextResponse.json({ ok: false, error: "No image provided." }, { status: 400 });
  }

  const parsedImages = images
    .slice(0, MAX_IMAGES)
    .filter((v): v is string => typeof v === "string")
    .map(parseDataUrl)
    .filter((v): v is { mediaType: string; data: string } => v !== null);

  if (parsedImages.length === 0) {
    return NextResponse.json({ ok: false, error: "Unsupported image format." }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...parsedImages.map((img) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: img.mediaType as "image/png" | "image/jpeg" | "image/webp", data: img.data },
            })),
            {
              type: "text" as const,
              text:
                parsedImages.length > 1
                  ? "First image is the front, second is the back. Extract the fields — colour and logo_box from the front only."
                  : "Extract the fields from this business card photo (the front).",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const parsed = textBlock && textBlock.type === "text" ? extractJson(textBlock.text) : null;
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "Couldn't parse a response." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, fields: coerceFields(parsed) });
  } catch (err) {
    console.error("scan-card:", err);
    return NextResponse.json({ ok: false, error: "Card reading failed." }, { status: 502 });
  }
}
