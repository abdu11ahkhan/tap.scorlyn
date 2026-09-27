import { ArrowRight, ChevronDown, ChevronRight, CreditCard, MapPin } from "lucide-react";
import {
  fontStack,
  hueShift,
  mixHex,
  paymentMethodsOf,
  resolveCardTheme,
  type ButtonKind,
  type CardProfile,
  type PaymentMethod,
  type ResolvedButton,
} from "@/lib/card";
import CopyRow from "@/components/nfc/CopyRow";
import { iconFor } from "./button-icons";
import BackgroundEffect from "./BackgroundEffect";
import LinkButtons, { hasButtonOverride } from "./LinkButtons";

/**
 * GAMING — a venue page, not a person page. Cover photo up top, the venue's
 * name in wide black caps, then every link as a coloured tile.
 *
 * Tiles take their colour from what the link *is* (WhatsApp green, Instagram
 * pink) rather than the accent, because at a glance-and-tap venue that colour
 * is how people find the button. Anything without a recognisable brand falls
 * back to a hue rotated off the owner's accent, so it still belongs to them.
 */

const KIND_HUE: Partial<Record<ButtonKind, string>> = {
  whatsapp: "#10B981",
  instagram: "#E11D48",
  facebook: "#2563EB",
  tiktok: "#9333EA",
  youtube: "#DC2626",
  discord: "#6366F1",
  twitch: "#9146FF",
  pay: "#3B82F6",
  maps: "#EAB308",
  phone: "#0EA5E9",
  calendar: "#14B8A6",
  menu: "#F59E0B",
  shop: "#F59E0B",
};

const KIND_COPY: Partial<Record<ButtonKind, [string, string]>> = {
  whatsapp: ["Chat with our team", "Message"],
  instagram: ["Follow us for updates", "Follow"],
  facebook: ["Join our community", "Like"],
  tiktok: ["Watch our latest videos", "Watch"],
  youtube: ["Streams and highlights", "Watch"],
  discord: ["Join the server", "Join"],
  twitch: ["Catch us live", "Watch"],
  pay: ["Pay for your session", "Pay Now"],
  maps: ["Find us on Google Maps", "Directions"],
  phone: ["Call the front desk", "Call"],
  email: ["Drop us a line", "Email"],
  calendar: ["Book a station", "Book"],
  menu: ["Snacks and drinks", "View"],
  shop: ["Gear and merch", "Shop"],
};

const SOCIAL = new Set<ButtonKind>(["instagram", "facebook", "tiktok", "youtube", "discord", "twitch", "x"]);

const isReview = (b: ResolvedButton) => b.kind === "link" && /review/i.test(b.label);

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const PAY_HUE = "#3B82F6";
const PAY_KIND_LABEL: Record<PaymentMethod["kind"], string> = {
  bank: "Bank transfer",
  easypaisa: "EasyPaisa",
  jazzcash: "JazzCash",
  other: "Other",
};

/**
 * "Make a Payment" as a tile that opens onto every account. Native <details>,
 * like the payment block every other template gets: no JavaScript, closed by
 * default so an account number isn't on screen until someone asks for it, and
 * it widens to the full row when open so numbers aren't squeezed into half.
 */
function PaymentTile({
  methods,
  payLink,
  owner,
  accent,
  fgMuted,
  wide,
}: {
  methods: PaymentMethod[];
  payLink?: ResolvedButton;
  owner: string;
  accent: string;
  fgMuted: string;
  wide: boolean;
}) {
  const light = mixHex(PAY_HUE, "#ffffff", 0.45);
  const ways = methods.length + (payLink ? 1 : 0);
  return (
    <details
      className={`card-rise group rounded-[24px] border p-4 open:col-span-2 ${wide ? "col-span-2" : ""}`}
      style={{ background: `${PAY_HUE}14`, borderColor: `${PAY_HUE}80`, ["--d" as string]: "230ms" }}
    >
      <summary className="flex min-h-[108px] cursor-pointer list-none flex-col [&::-webkit-details-marker]:hidden">
        <div className="mb-3 flex items-start justify-between">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl border"
            style={{ background: `${PAY_HUE}26`, borderColor: `${PAY_HUE}40`, color: light }}
          >
            <CreditCard className="h-5 w-5" />
          </span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" style={{ color: fgMuted }} />
        </div>
        <span className="text-[14px] font-bold leading-tight">Make a Payment</span>
        <span className="mt-1 text-[11px] font-medium leading-snug" style={{ color: fgMuted }}>
          {ways === 1 ? "Pay for your session" : `${ways} ways to pay`}
        </span>
        <span
          className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wide"
          style={{ borderColor: `${PAY_HUE}80`, background: `${PAY_HUE}1a`, color: light }}
        >
          Pay Now
          <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
        </span>
      </summary>

      <div className="mt-4 space-y-2.5">
        {payLink && (
          <a
            href={payLink.href}
            target={payLink.external ? "_blank" : undefined}
            rel={payLink.external ? "noopener noreferrer" : undefined}
            className="flex items-center justify-between rounded-xl px-3.5 py-3 text-[13px] font-bold"
            style={{ background: PAY_HUE, color: "#ffffff" }}
          >
            Pay online
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {methods.map((m, i) => (
          <div key={i} className="rounded-xl border p-3" style={{ borderColor: "#ffffff1f", background: "#ffffff08" }}>
            <p className="text-[13px] font-bold" style={{ color: light }}>
              {m.label?.trim() || PAY_KIND_LABEL[m.kind] || m.kind}
            </p>
            <div className="mt-1.5">
              {m.account_name && <CopyRow label="Name" value={m.account_name} accent={accent} />}
              {m.account_number && <CopyRow label="Account" value={m.account_number} accent={accent} />}
              {m.iban && <CopyRow label="IBAN" value={m.iban} accent={accent} />}
            </div>
          </div>
        ))}
        <p className="text-[10px] font-medium leading-relaxed" style={{ color: fgMuted }}>
          Tap any line to copy it. Always confirm these details with {owner} before sending money.
        </p>
      </div>
    </details>
  );
}

export default function ArenaCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#050508");
  const { accent } = theme;
  const second = hueShift(accent, 60);
  const note = card.available_for_work ? card.availability_note?.trim() : "";
  const socials = buttons.filter((b) => SOCIAL.has(b.kind));

  // Accounts fold into the "Make a Payment" tile, and an online pay link goes
  // inside it too rather than sitting beside it as a second payment tile.
  const methods = card.payment_enabled ? paymentMethodsOf(card) : [];
  const payLink = methods.length ? buttons.find((b) => b.kind === "pay") : undefined;
  const tiles = payLink ? buttons.filter((b) => b !== payLink) : buttons;
  const tileCount = tiles.length + (methods.length ? 1 : 0);

  const mapsButton = buttons.find((b) => b.kind === "maps");
  const mapsHref =
    mapsButton?.href ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${card.full_name} ${card.location ?? ""}`.trim())}`;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
      data-intro={card.intro_style || "rise"}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />
      <div
        className="pointer-events-none absolute -left-[20%] top-[12%] h-[300px] w-[300px] rounded-full opacity-20 blur-[100px]"
        style={{ background: accent }}
      />
      <div
        className="pointer-events-none absolute -right-[20%] top-[42%] h-[300px] w-[300px] rounded-full opacity-20 blur-[100px]"
        style={{ background: second }}
      />

      <div className="relative mx-auto w-full max-w-[480px]">
        {/* Hero. Capped in px as well as vh: the gallery renders this in a very
            tall iframe, where 40vh alone would be most of the thumbnail. */}
        <header className="relative h-[40vh] max-h-[360px] min-h-[280px] w-full overflow-hidden">
          {card.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(120% 90% at 80% 10%, ${accent}55, transparent 60%), radial-gradient(90% 80% at 10% 30%, ${second}44, transparent 60%)`,
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${theme.surface}cc, ${theme.surface}66 45%, ${theme.surface})`,
            }}
          />

          <div className="relative z-10 flex items-start justify-between gap-3 p-5 pt-8">
            <div className="card-rise flex min-w-0 items-center gap-3" style={{ ["--d" as string]: "0ms" }}>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border backdrop-blur-md"
                style={{
                  borderColor: "#ffffff1a",
                  background: "#ffffff0d",
                  boxShadow: `0 0 16px ${accent}80`,
                }}
              >
                {card.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.avatar_url} alt={card.full_name} className="h-full w-full object-cover" />
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 19L10 5H15L9 19H4Z" fill={accent} />
                    <path d="M14 19L20 5H18L12 19H14Z" fill={second} />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <h1
                  className="card-name text-[22px] font-black uppercase leading-none tracking-[0.12em]"
                  style={{ minHeight: 0 }}
                >
                  {card.full_name}
                </h1>
                {card.headline && (
                  <p
                    className="card-headline mt-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: theme.fgDim, minHeight: 0 }}
                  >
                    {card.headline}
                  </p>
                )}
                {card.company && (
                  <p
                    className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: mixHex(accent, "#ffffff", 0.3) }}
                  >
                    {card.company}
                  </p>
                )}
              </div>
            </div>

            {note && (
              <span
                className="card-rise mt-1 block max-w-[8.5rem] shrink-0 -rotate-6 whitespace-pre-line text-right text-[1.45rem] leading-tight opacity-90"
                style={{
                  fontFamily: "'Caveat', 'Segoe Print', 'Bradley Hand', cursive",
                  color: mixHex(second, "#ffffff", 0.35),
                  ["--d" as string]: "80ms",
                }}
              >
                {note}
              </span>
            )}
          </div>
        </header>

        <main className="relative z-10 -mt-8 px-5 pb-28">
          <span
            className="card-rise inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur-md"
            style={{ borderColor: "#ffffff1a", background: "#ffffff0d", color: theme.fgDim, ["--d" as string]: "120ms" }}
          >
            Welcome
          </span>
          {card.bio && (
            <p
              className="card-bio card-rise mt-4 text-[13px] font-medium tracking-wide"
              style={{ color: theme.fgMuted, minHeight: 0, ["--d" as string]: "160ms" }}
            >
              {card.bio}
            </p>
          )}
          {card.location && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="card-location card-rise mt-2 flex w-fit items-center gap-1.5 text-[11px] underline-offset-2 hover:underline"
              style={{ color: theme.fgMuted, ["--d" as string]: "190ms" }}
            >
              <MapPin className="h-3 w-3 shrink-0" />
              {card.location}
            </a>
          )}

          {hasButtonOverride(card) ? (
            <LinkButtons card={card} buttons={buttons} style={card.button_style as "badge" | "gradient" | "solid" | "outline" | "block"} />
          ) : (
            <nav className="group/grid mt-7 grid grid-cols-2 gap-3">
              {methods.length > 0 && (
                <PaymentTile
                  methods={methods}
                  payLink={payLink}
                  owner={card.full_name}
                  accent={accent}
                  fgMuted={theme.fgMuted}
                  wide={tileCount % 2 === 1 && tiles.length === 0}
                />
              )}
              {tiles.map((button, i) => {
                const index = i + (methods.length > 0 ? 1 : 0);
                const review = isReview(button);
                const hue = review ? "#EA580C" : KIND_HUE[button.kind] ?? hueShift(accent, index * 47);
                const light = mixHex(hue, "#ffffff", 0.45);
                const [sub, cta] = review ? ["Leave us a review", "Rate Us"] : KIND_COPY[button.kind] ?? ["Tap to open", "Open"];
                const Icon = iconFor(button.kind);
                const last = index === tileCount - 1;
                // An open payment drawer takes a whole row, which flips whether
                // the last tile needs to stretch to keep the grid even.
                const wide = !last
                  ? ""
                  : tileCount % 2 === 1
                    ? methods.length
                      ? "col-span-2 group-has-[[open]]/grid:col-span-1"
                      : "col-span-2"
                    : methods.length
                      ? "group-has-[[open]]/grid:col-span-2"
                      : "";
                return (
                  <a
                    key={`${button.href}-${index}`}
                    href={button.href}
                    target={button.external ? "_blank" : undefined}
                    rel={button.external ? "noopener noreferrer" : undefined}
                    className={`card-rise group relative flex min-h-[140px] flex-col rounded-[24px] border p-4 transition-transform active:scale-[0.98] ${wide}`}
                    style={{
                      background: `${hue}14`,
                      borderColor: `${hue}80`,
                      ["--d" as string]: `${230 + index * 55}ms`,
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                        style={{ background: `${hue}26`, borderColor: `${hue}40`, color: light }}
                      >
                        {review ? <GoogleG className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-active:translate-x-1" style={{ color: theme.fgMuted }} />
                    </div>
                    <span className="text-[14px] font-bold leading-tight">{button.label}</span>
                    <span className="mt-1 text-[11px] font-medium leading-snug" style={{ color: theme.fgMuted }}>
                      {sub}
                    </span>
                    <span
                      className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wide"
                      style={{ borderColor: `${hue}80`, background: `${hue}1a`, color: light }}
                    >
                      {cta}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </a>
                );
              })}
            </nav>
          )}

          {socials.length >= 2 && (
            <footer className="card-rise mt-9 text-center" style={{ ["--d" as string]: "600ms" }}>
              <div className="flex items-center gap-4">
                <span className="h-px flex-1" style={{ background: theme.border }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.fgMuted }}>
                  Follow us
                </span>
                <span className="h-px flex-1" style={{ background: theme.border }} />
              </div>
              <div className="mt-5 flex justify-center gap-5">
                {socials.map((button, index) => {
                  const Icon = iconFor(button.kind);
                  return (
                    <a
                      key={`${button.href}-social-${index}`}
                      href={button.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={button.label}
                      className="flex h-11 w-11 items-center justify-center"
                      style={{ color: theme.fgDim }}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </footer>
          )}

          <p
            className="card-rise mt-7 text-center text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: theme.fgMuted, opacity: 0.6, ["--d" as string]: "650ms" }}
          >
            Powered by ScorlynTap
          </p>
        </main>
      </div>
    </div>
  );
}
