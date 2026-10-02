import { MessageCircle, Mail, Package, Palette, Truck, Clock } from "lucide-react";
import { normalizeWhatsapp } from "@/lib/referral";
import PosterTitle from "./PosterTitle";

/**
 * How to reach a human — for questions, and for bulk orders.
 *
 * Bulk is called out separately because a club or an office ordering thirty
 * cards has a different question from someone ordering one, and that is the
 * enquiry worth catching. The three cards answer what a bulk buyer actually
 * asks before they message: can you print our design, does the price move, and
 * will it reach us.
 *
 * The details come from app_settings so they are editable in the admin Content
 * tab rather than needing a deploy.
 */

const POINTS = [
  {
    icon: Palette,
    title: "your design",
    body: "Send us your artwork and we print it on the card. No artwork? We'll set it up from your logo.",
    chip: "bg-sun text-char",
    tilt: "-1.5deg",
  },
  {
    icon: Package,
    title: "volume pricing",
    body: "Ordering ten or more? The rate drops. Tell us the quantity and we'll quote you the same day.",
    chip: "bg-sea text-white",
    tilt: "2deg",
  },
  {
    icon: Truck,
    title: "delivered to you",
    body: "Anywhere in Pakistan, cash on delivery. Every card arrives programmed and ready to tap.",
    chip: "bg-char text-white",
    tilt: "-2deg",
  },
];

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
  const compose = (to: string, subj: string) =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subj}`;
  const bulkSubject = encodeURIComponent("Bulk order enquiry");
  const waText = encodeURIComponent(
    "Hi ScorlynTap, I have a question about your NFC cards."
  );
  const waBulkText = encodeURIComponent(
    "Hi ScorlynTap, I'd like a quote for a bulk order of NFC cards."
  );

  // The page's one button shape: pill, charcoal outline, hard shadow.
  const cta =
    "brut-sm brut-press flex h-14 items-center justify-center gap-2.5 rounded-full px-6 text-base font-black uppercase tracking-tight";

  return (
    <section id="contact" className="dot-grid relative scroll-mt-20 border-b-[3px] border-char bg-white py-24 text-char">
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mb-14">
          <PosterTitle
            lead="Questions?"
            accent="Bulk order"
            sub="Message us directly — a real person answers. For teams, clubs and offices we do custom artwork and volume pricing."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <article
                key={point.title}
                style={{ rotate: point.tilt }}
                className="brut brut-press rounded-[1.75rem] bg-cream p-7 text-char hover:!rotate-0"
              >
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-char ${point.chip}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="display mb-2 text-[34px]">{point.title}</h3>
                <p className="text-[15px] font-semibold leading-relaxed text-char/75">{point.body}</p>
              </article>
            );
          })}
        </div>

        <div className="brut mt-14 rounded-[1.75rem] bg-sun p-7 sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-sm">
              <h3 className="display text-[40px]">Start a conversation</h3>
              <p className="mt-2 flex items-center gap-2 text-[15px] font-bold text-char/75">
                <Clock className="h-4 w-4 shrink-0" />
                We usually reply within a few hours.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[26rem]">
              {wa && (
                <a
                  href={`https://wa.me/${wa}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cta} bg-sea text-white`}
                >
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  whatsapp
                </a>
              )}

              {mail && (
                <a
                  href={compose(mail, subject)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cta} bg-white text-char`}
                >
                  <Mail className="h-5 w-5 shrink-0" />
                  email
                </a>
              )}

              <a
                href={
                  wa
                    ? `https://wa.me/${wa}?text=${waBulkText}`
                    : compose(mail as string, bulkSubject)
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`${cta} bg-char text-sun sm:col-span-2`}
              >
                <Package className="h-5 w-5 shrink-0" />
                get a bulk quote
              </a>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}
