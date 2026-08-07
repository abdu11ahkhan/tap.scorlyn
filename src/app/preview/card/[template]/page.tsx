import { notFound } from "next/navigation";
import { renderCardTemplate } from "@/components/card-templates";
import { resolveButtons, TEMPLATE_IDS, type CardProfile } from "@/lib/card";
import { DEMO_PERSONAS, FALLBACK_PERSONA } from "./demo-data";
import PreviewChrome from "./PreviewChrome";

// Pure computation from the route and its query — no database, no session, no
// per-visitor anything. force-dynamic here only defeated caching, and the
// gallery loads this route dozens of times per visit.
export const revalidate = 3600;

/**
 * Placeholder portrait as an inline SVG data URI.
 *
 * Previews used to fall back to initials, which left every template looking
 * half-finished. A data URI keeps this offline and costs no request, and it
 * tints itself with whatever accent the gallery is demoing.
 */
function demoAvatar(accent: string): string {
  // Portrait aspect, not square: Showcase uses this as a full-bleed cover, and
  // object-cover on a square blew the subject up into an unrecognisable blob.
  // The head sits at ~40% height so a centre-square crop (the circular avatars)
  // still frames it properly. SVG stays sharp at every size.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accent}55"/>
    </linearGradient>
    <linearGradient id="sub" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="400" height="520" fill="url(#bg)"/>
  <circle cx="330" cy="90" r="62" fill="#ffffff" opacity="0.09"/>
  <circle cx="62" cy="150" r="38" fill="#ffffff" opacity="0.07"/>
  <!-- Head and shoulders overlap into one connected silhouette. Drawn apart
       they read as a circle floating over a dome in Showcase's wide crop, and
       a narrow connecting neck turns into a lightbulb in the circular ones. -->
  <circle cx="200" cy="215" r="85" fill="url(#sub)"/>
  <path d="M58 520C58 380 122 290 200 290s142 90 142 230z" fill="url(#sub)"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Placeholder "photograph" for cover and gallery slots — an abstract landscape
 * built from the accent. Also inline SVG, so previews of the photo-led
 * templates work with no uploads and no network.
 */
function demoScene(accent: string, seed: number): string {
  // Deterministic variation so the gallery isn't four identical tiles.
  const hills = [
    "M0 300 Q100 210 200 270 T400 240 V400 H0Z",
    "M0 320 Q120 240 240 300 T400 260 V400 H0Z",
    "M0 290 Q90 340 190 280 T400 310 V400 H0Z",
    "M0 330 Q140 250 260 320 T400 280 V400 H0Z",
    "M0 310 Q110 260 210 330 T400 250 V400 H0Z",
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accent}33"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#sky)"/>
  <circle cx="${300 - seed * 30}" cy="${90 + seed * 12}" r="42" fill="#ffffff" opacity="0.35"/>
  <path d="${hills[seed % hills.length]}" fill="#000000" opacity="0.22"/>
  <path d="${hills[(seed + 2) % hills.length]}" fill="#000000" opacity="0.34"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Sample card used to preview a template before you commit to it. */
function demoCard(template: string, accent: string, font: string): CardProfile {
  const persona = DEMO_PERSONAS[template] ?? FALLBACK_PERSONA;

  // Only the photo-led templates get a gallery; the rest would ignore it.
  const captions = persona.captions ?? [];

  return {
    id: "preview",
    username: persona.username,
    full_name: persona.full_name,
    headline: persona.headline,
    company: persona.company,
    bio: persona.bio,
    avatar_url: demoAvatar(accent),
    cover_url: demoScene(accent, 0),
    logo_url: null,
    cover_mode: "cover",
    gallery: captions.map((caption, index) => ({
      url: demoScene(accent, index + 1),
      caption,
    })),
    location: `${persona.location}, Pakistan`,
    whatsapp: persona.whatsapp,
    phone: persona.phone,
    email: persona.email,
    buttons: persona.buttons,
    available_for_work: true,
    availability_note: "Taking new work this month",
    business_hours: [
      { day: "Mon – Fri", hours: "10am – 7pm" },
      { day: "Saturday", hours: "12pm – 5pm" },
    ],
    video_url: null,
    background_style: "accent",
    payment_enabled: false,
    payment_methods: [],
    view_count: 0,
    accent_color: accent,
    template,
    font,
    referral_code: null,
  };
}

export default async function CardTemplatePreview({
  params,
  searchParams,
}: {
  params: Promise<{ template: string }>;
  searchParams: Promise<{ accent?: string; font?: string; raw?: string }>;
}) {
  const { template } = await params;
  const { accent, font, raw } = await searchParams;

  if (!TEMPLATE_IDS.includes(template as (typeof TEMPLATE_IDS)[number])) {
    return notFound();
  }

  // Only accept a hex colour — this value lands in an inline style.
  const safeAccent = accent && /^#[0-9a-fA-F]{3,8}$/.test(accent) ? accent : "#111111";
  const safeFont = ["sans", "serif", "mono"].includes(font ?? "") ? font! : "sans";

  const card = demoCard(template, safeAccent, safeFont);
  const rendered = renderCardTemplate({ card, buttons: resolveButtons(card.buttons) });

  // raw=1 is what the chrome's iframe (and the gallery thumbnails) load: just
  // the card, no toolbar, no nesting.
  if (raw === "1") return rendered;

  const query = new URLSearchParams({ accent: safeAccent, font: safeFont, raw: "1" });

  return (
    <PreviewChrome src={`/preview/card/${template}?${query}`} templateId={template} />
  );
}
