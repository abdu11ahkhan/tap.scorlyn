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

  const tile =
    "sticker sticker-press flex items-center gap-3 rounded-2xl border-2 border-ink px-5 py-4 text-[15px] font-black text-ink";

  return (
    <section id="contact" className="relative px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[12px] font-black uppercase tracking-[0.25em] text-ink/40">
          talk to us
        </p>
        <h2 className="mt-3 text-4xl font-black leading-[1.05] tracking-tighter text-ink sm:text-5xl">
          questions? bulk order?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] font-semibold text-ink/55">
          Message us directly. For teams, clubs and offices we do custom
          artwork and volume pricing — tell us how many you need.
        </p>

        <div className="mx-auto mt-9 grid max-w-xl gap-3 sm:grid-cols-2">
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${tile} bg-acid`}
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              <span className="text-left">WhatsApp us</span>
            </a>
          )}

          {mail && (
            <EmailAction email={mail} subject={subject} className={`${tile} bg-white`}>
              Email us
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
            className={`${tile} w-full justify-center bg-hotpink text-white`}
          >
            <Package className="h-5 w-5 shrink-0" />
            Ask about bulk orders
          </a>
        </div>

        {mail && (
          <p className="mt-6 select-all text-[13px] font-bold text-ink/45">
            or write to <span className="text-ink underline decoration-acid decoration-4">{mail}</span>
          </p>
        )}
      </div>
    </section>
  );
}
