import { Banknote, ChevronDown, Clock, PlayCircle } from "lucide-react";
import { readableOn, type BusinessHour, type CardProfile, type PaymentMethod } from "@/lib/card";
import CopyRow from "./CopyRow";

/**
 * Optional blocks appended below whichever template rendered above.
 *
 * Rendered here rather than inside each template on purpose: there are 21
 * templates, and threading five optional sections through all of them would
 * mean 21 places to change every time one is tweaked. Each block only appears
 * when the owner has filled it in, so a card with none of them looks exactly
 * as it did before.
 */

/** Turns a YouTube/Vimeo/TikTok link into its embeddable form. */
function embedUrl(raw: string): string | null {
  const url = raw.trim();

  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  const tiktok = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (tiktok) return `https://www.tiktok.com/embed/v2/${tiktok[1]}`;

  return null;
}

function PaymentRow({ method, accent }: { method: PaymentMethod; accent: string }) {
  const rows = [
    method.account_name ? { k: "Name", v: method.account_name } : null,
    method.account_number ? { k: "Account", v: method.account_number } : null,
    method.iban ? { k: "IBAN", v: method.iban } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--x-line)", background: "var(--x-panel)" }}>
      <p className="text-sm font-black" style={{ color: accent }}>
        {method.label || method.kind}
      </p>
      <div className="mt-2 space-y-0.5">
        {rows.map((r) => (
          <CopyRow key={r.k} label={r.k} value={r.v} accent={accent} />
        ))}
      </div>
      <p className="mt-1.5 px-0.5 text-[10px] font-semibold" style={{ color: "var(--x-faint)" }}>
        Tap any line to copy it.
      </p>
    </div>
  );
}

/**
 * Whether any extras block will render.
 *
 * Exported so the page can tell the template above it that it is no longer the
 * last thing on the page — every template is min-h-screen, which reserves a
 * whole viewport of dead space when its content is short.
 */
export function hasProfileExtras(card: CardProfile): boolean {
  const hours = (Array.isArray(card.business_hours) ? card.business_hours : []).filter(
    (h: BusinessHour) => h?.day?.trim() && h?.hours?.trim()
  );
  const methods = (Array.isArray(card.payment_methods) ? card.payment_methods : []).filter(
    (m: PaymentMethod) => m?.account_number?.trim() || m?.iban?.trim()
  );
  return Boolean(
    hours.length || (card.video_url && embedUrl(card.video_url)) ||
      (card.payment_enabled && methods.length)
  );
}

export default function ProfileExtras({
  card,
  tone = "#ffffff",
}: {
  card: CardProfile;
  /**
   * The colour the card above ends on. The extras used to be a fixed white
   * slab, which on a dark template met it as a hard seam halfway down the
   * page — and left the QR trigger, styled for the dark card, invisible once
   * it crossed onto the white.
   */
  tone?: string;
}) {
  const accent = card.accent_color || "#111111";
  const dark = isDark(tone);
  /** The hard offset shadow only draws on light ground; on black it is black
   *  on black. */
  const stamp = dark ? undefined : { boxShadow: "4px 4px 0 0 #0a0a0a" };

  const hours = (Array.isArray(card.business_hours) ? card.business_hours : []).filter(
    (h: BusinessHour) => h?.day?.trim() && h?.hours?.trim()
  );
  const methods = (Array.isArray(card.payment_methods) ? card.payment_methods : []).filter(
    (m: PaymentMethod) => m?.account_number?.trim() || m?.iban?.trim()
  );
  const video = card.video_url ? embedUrl(card.video_url) : null;

  const showPayments = card.payment_enabled && methods.length > 0;
  const nothingToShow = !hours.length && !video && !showPayments;

  if (nothingToShow) return null;

  return (
    <section
      // relative + z-10: templates that paint a full-bleed backdrop do it with
      // a `fixed inset-0` layer carrying no z-index. A positioned element
      // inside an earlier sibling paints above a later static one, so that
      // backdrop was laid over this whole section — on glass it veiled the
      // hours and the pay control alike, which reads as the buttons being
      // transparent when they are simply underneath something.
      className="card-extras relative z-10 pb-20 pt-2"
      style={
        {
          background: tone,
          color: dark ? "#F5F5F5" : "#111111",
          "--x-panel": dark ? "rgba(255,255,255,0.055)" : "#ffffff",
          // Controls get their own fill, because a panel tint and a button are
          // not the same job. At 5.5% white over a near-black card the panel
          // colour is a wash, which left "Pay ..." looking like an outline
          // with a hole in it rather than something you press. Lifted off the
          // card's own ground rather than a fixed grey, so it still sits
          // right when the owner has picked a surface colour.
          "--x-button": dark ? lift(tone, 0.12) : "#ffffff",
          // The controls are drawn in the sticker language — ink border, hard
          // offset shadow — and ink is #0a0a0a. On a near-black card that is
          // the border, the shadow *and* (before --x-button) the fill all
          // invisible at once, which is the whole reason "Pay ..." looked like
          // floating text rather than a button. On dark ground the edge
          // becomes a light hairline and the hard shadow is dropped, since an
          // offset black square against black draws nothing.
          "--x-edge": dark ? "rgba(255,255,255,0.22)" : "#0a0a0a",
          "--x-line": dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)",
          "--x-muted": dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
          "--x-faint": dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto w-full max-w-sm space-y-5 px-5">
        {video && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] [color:var(--x-muted)]">
              <PlayCircle className="h-3.5 w-3.5" />
              watch
            </p>
            <div className="overflow-hidden rounded-2xl border [border-color:var(--x-line)] bg-black">
              <iframe
                src={video}
                title="Video"
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full border-0"
              />
            </div>
          </div>
        )}

        {hours.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] [color:var(--x-muted)]">
              <Clock className="h-3.5 w-3.5" />
              hours
            </p>
            <div className="rounded-2xl border [border-color:var(--x-line)] [background:var(--x-panel)]">
              {hours.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b [border-color:var(--x-line)] px-4 py-2.5 last:border-0"
                >
                  <span className="text-sm font-bold">{h.day}</span>
                  <span className="text-sm font-semibold [color:var(--x-muted)]">{h.hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPayments && (
          /* Closed by default. An account number is the one thing on this page
             that shouldn't be readable over someone's shoulder, or sitting in
             frame the moment a stranger screenshots the card. Opening it is a
             deliberate act. Native <details>, so it works without JavaScript
             and keyboard behaviour comes free. */
          <details className="group">
            {/* Sized and weighted like the link buttons above it. As a pale
                hairline panel it read as a disabled block rather than the
                tappable thing it is. */}
            <summary style={stamp}
              className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border-2 [border-color:var(--x-edge)] [background:var(--x-button)] px-4 py-3 [&::-webkit-details-marker]:hidden group-open:rounded-b-none">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink"
                style={{ background: accent, color: readableOn(accent) }}
              >
                <Banknote className="h-4 w-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-black leading-tight">
                  Pay {card.full_name.split(" ")[0]}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-tight [color:var(--x-muted)]">
                  {methods.length === 1
                    ? "Tap to see bank details"
                    : `Tap to see ${methods.length} payment options`}
                </span>
              </span>

              <ChevronDown className="h-4 w-4 shrink-0 [color:var(--x-muted)] transition-transform group-open:rotate-180" />
            </summary>

            {/* Same fill as the summary above: the drawer is the lower half of
                the same object, and a solid button opening onto a washed-out
                panel reads as broken. */}
            <div style={stamp}
              className="space-y-2.5 rounded-b-2xl border-2 border-t-0 [border-color:var(--x-edge)] [background:var(--x-button)] px-4 pb-4 pt-4">
              {methods.map((m, i) => (
                <PaymentRow key={i} method={m} accent={accent} />
              ))}

              {/* Anyone can screenshot a public page and reuse the branding with
                  their own number. Saying so costs nothing and prevents real loss. */}
              <p className="text-[11px] font-semibold leading-relaxed [color:var(--x-muted)]">
                Always confirm these details directly with{" "}
                {card.full_name.split(" ")[0]} before sending money.
              </p>
            </div>
          </details>
        )}
      </div>
    </section>
  );
}


/** Mix a colour toward white by `amount`, staying opaque. */
function lift(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const channel = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16);
    return Math.round(v + (255 - v) * amount)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

/** Duplicated rather than imported: this file is a client component and the
 *  helper in lib/card pulls in server-only neighbours. */
function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.4;
}
