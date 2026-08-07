import { MessageCircle, Package } from "lucide-react";
import EmailAction from "./EmailAction";
import { normalizeWhatsapp } from "@/lib/referral";

/**
 * How to reach a human — for questions, and for bulk orders.
 *
 * Bulk is called out separately because a club or an office ordering thirty
 * cards has a different question from someone ordering one, and nothing on the
 * page previously told them there was anyone to ask.
 *
 * The details come from app_settings so they are editable in the admin Content
 * tab rather than needing a deploy.
 */
export function Contact({
  whatsapp,
  email,
}: {
  whatsapp?: string | null;
  email?: string | null;
}) {
  const wa = normalizeWhatsapp(whatsapp ?? "");
  const mail = email?.trim() || null;

  // Nothing configured means no section at all, rather than a panel of dead
  // buttons that make the business look abandoned.
  if (!wa && !mail) return null;

  const subject = encodeURIComponent("ScorlynTap enquiry");
  const bulkSubject = encodeURIComponent("Bulk order enquiry");
  const waText = encodeURIComponent(
    "Hi ScorlynTap, I have a question about your NFC cards."
  );
  const waBulkText = encodeURIComponent(
    "Hi ScorlynTap, I'd like a quote for a bulk order of NFC cards."
  );

  // The same button shape the rest of the page uses: h-14, full radius, heavy
  // ink border, uppercase. Anything else reads as bolted on.
  const cta =
    "sticker sticker-press flex h-14 items-center justify-center gap-2.5 rounded-full border-2 border-ink px-6 text-base font-black uppercase tracking-tight";

  return (
    <section
      id="contact"
      className="grain relative overflow-hidden bg-ink py-28 text-white"
    >
      <div className="float-orb pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-acid/15 blur-[130px]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <p className="text-[12px] font-black uppercase tracking-[0.25em] text-white/40">
          talk to us
        </p>
        <h2 className="mt-4 text-[clamp(2.2rem,7vw,3.5rem)] font-black leading-[0.95] tracking-tighter">
          questions? bulk order?
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg font-medium text-white/60">
          Message us directly. For teams, clubs and offices we do custom artwork
          and volume pricing — tell us how many you need.
        </p>

        <div className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${cta} bg-acid text-ink`}
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              whatsapp
            </a>
          )}

          {mail && (
            <EmailAction email={mail} subject={subject} className={`${cta} bg-white text-ink`}>
              email
            </EmailAction>
          )}
        </div>

        <div className="mx-auto mt-3 max-w-xl">
          <a
            href={
              wa
                ? `https://wa.me/${wa}?text=${waBulkText}`
                : `mailto:${mail}?subject=${bulkSubject}`
            }
            target={wa ? "_blank" : undefined}
            rel={wa ? "noopener noreferrer" : undefined}
            className={`${cta} w-full bg-hotpink text-white`}
          >
            <Package className="h-5 w-5 shrink-0" />
            bulk orders
          </a>
        </div>

        {mail && (
          <p className="mt-8 select-all text-[13px] font-bold text-white/35">
            or write to{" "}
            <span className="text-white underline decoration-acid decoration-4 underline-offset-4">
              {mail}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
