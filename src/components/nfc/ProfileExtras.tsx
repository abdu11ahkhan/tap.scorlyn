import { Banknote, ChevronDown, Clock, Download, PlayCircle } from "lucide-react";
import { readableOn, type BusinessHour, type CardProfile, type PaymentMethod } from "@/lib/card";
import CopyRow from "./CopyRow";
import SaveContact from "@/components/card-templates/SaveContact";

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
    <div className="rounded-xl border border-black/10 bg-white p-3.5">
      <p className="text-sm font-black" style={{ color: accent }}>
        {method.label || method.kind}
      </p>
      <div className="mt-2 space-y-0.5">
        {rows.map((r) => (
          <CopyRow key={r.k} label={r.k} value={r.v} accent={accent} />
        ))}
      </div>
      <p className="mt-1.5 px-0.5 text-[10px] font-semibold text-black/25">
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

export default function ProfileExtras({ card }: { card: CardProfile }) {
  const accent = card.accent_color || "#111111";

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
    <section className="bg-white px-5 pb-20 pt-2 text-[#111]">
      <div className="mx-auto w-full max-w-sm space-y-5">
        {video && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-black/35">
              <PlayCircle className="h-3.5 w-3.5" />
              watch
            </p>
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-black">
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
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-black/35">
              <Clock className="h-3.5 w-3.5" />
              hours
            </p>
            <div className="rounded-2xl border border-black/10 bg-white">
              {hours.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-black/5 px-4 py-2.5 last:border-0"
                >
                  <span className="text-sm font-bold">{h.day}</span>
                  <span className="text-sm font-semibold text-black/55">{h.hours}</span>
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
            <summary className="flex min-h-[60px] cursor-pointer list-none items-center gap-3 rounded-2xl border-2 border-[#111] bg-white px-4 py-3 shadow-[4px_4px_0_0_#111] transition-transform [&::-webkit-details-marker]:hidden group-open:rounded-b-none group-open:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#111]"
                style={{ background: accent, color: readableOn(accent) }}
              >
                <Banknote className="h-4 w-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-black leading-tight">
                  Pay {card.full_name.split(" ")[0]}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-tight text-black/45">
                  {methods.length === 1
                    ? "Tap to see bank details"
                    : `Tap to see ${methods.length} payment options`}
                </span>
              </span>

              <ChevronDown className="h-4 w-4 shrink-0 text-black/40 transition-transform group-open:rotate-180" />
            </summary>

            <div className="space-y-2.5 rounded-b-2xl border-2 border-t-0 border-[#111] bg-white px-4 pb-4 pt-4 shadow-[4px_4px_0_0_#111]">
              {methods.map((m, i) => (
                <PaymentRow key={i} method={m} accent={accent} />
              ))}

              {/* Anyone can screenshot a public page and reuse the branding with
                  their own number. Saying so costs nothing and prevents real loss. */}
              <p className="text-[11px] font-semibold leading-relaxed text-black/40">
                Always confirm these details directly with{" "}
                {card.full_name.split(" ")[0]} before sending money.
              </p>
            </div>
          </details>
        )}

        <SaveContact
          card={card}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-[#111] bg-white text-[15px] font-black shadow-[4px_4px_0_0_#111] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Download className="h-4 w-4" />
          Save to contacts
        </SaveContact>
      </div>
    </section>
  );
}
