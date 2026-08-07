import { MessageCircle, Mail, Package, Palette, Truck, Clock } from "lucide-react";
import { normalizeWhatsapp } from "@/lib/referral";

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
    className: "bg-acid text-ink",
    tilt: "-1.5deg",
  },
  {
    icon: Package,
    title: "volume pricing",
    body: "Ordering ten or more? The rate drops. Tell us the quantity and we'll quote you the same day.",
    className: "bg-hotpink text-white",
    tilt: "2deg",
  },
  {
    icon: Truck,
    title: "delivered to you",
    body: "Anywhere in Pakistan, cash on delivery. Every card arrives programmed and ready to tap.",
    className: "bg-violet-pop text-white",
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

  // The same button shape the rest of the page uses: h-14, full radius, heavy
  // ink border, uppercase. Anything else reads as bolted on.
  const cta =
    "sticker sticker-press flex h-14 items-center justify-center gap-2.5 rounded-full border-2 border-ink px-6 text-base font-black uppercase tracking-tight";

  return (
    <section
      id="contact"
      className="grain relative overflow-hidden bg-ink py-28 text-white"
    >
      <div className="float-orb pointer-events-none absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-acid/15 blur-[130px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-3xl">
          <p className="text-[12px] font-black uppercase tracking-[0.25em] text-white/40">
            talk to us
          </p>
          <h2 className="mt-4 text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[0.88] tracking-[-0.05em]">
            questions?
            <br />
            <span className="text-acid">bulk order?</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg font-medium text-white/60">
            Message us directly — a real person answers. For teams, clubs and
            offices we do custom artwork and volume pricing.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <article
                key={point.title}
                style={{ rotate: point.tilt }}
                className={`sticker-lg rounded-[1.75rem] border-2 border-ink p-7 transition-transform duration-300 hover:!rotate-0 hover:-translate-y-1 ${point.className}`}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-ink/10">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2.5 text-2xl font-black tracking-tight">{point.title}</h3>
                <p
                  className={`text-[15px] font-medium leading-relaxed ${
                    point.className.includes("text-white") ? "opacity-95" : "opacity-70"
                  }`}
                >
                  {point.body}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-14 rounded-[1.75rem] border-2 border-white/12 bg-white/[0.03] p-7 sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-sm">
              <h3 className="text-2xl font-black tracking-tight">start a conversation</h3>
              <p className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-white/50">
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
                  className={`${cta} bg-acid text-ink`}
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
                  className={`${cta} bg-white text-ink`}
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
                className={`${cta} bg-hotpink text-white sm:col-span-2`}
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
