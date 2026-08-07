import { Calendar, Clock, Send } from "lucide-react";
import {
  roleLine,
  accentOn,
  fontStack,
  initialsOf,
  readableOn,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/** Indicative slots. Real availability needs a calendar integration. */
const SLOTS = ["09:00", "11:30", "14:00", "16:30"];

/**
 * FORM — request an appointment.
 *
 * Like Reply, this submits by mailto: so it works with no backend. The slots
 * are radio inputs whose value lands in the email body: the owner still
 * confirms manually, which is honest about there being no live calendar.
 */
export default function BookingCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#0D9488";
  const role = roleLine(card);
  // Accent used as *text*: a pale accent on a light card, or a dark one
  // on a dark card, is unreadable. Only the lightness moves.
  const ink = accentOn(accent, "light");
  const onAccent = readableOn(accent);
  const email = card.email?.trim();

  return (
    <div
      className="min-h-screen bg-[#F4F7F7] text-[#0F1A1A]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      {card.cover_url && (
        <div className="relative h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.cover_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F4F7F7] to-transparent" />
        </div>
      )}

      <main className={`mx-auto w-full max-w-md px-6 pb-24 ${card.cover_url ? "-mt-10" : "pt-14"}`}>
        <header className="card-rise relative flex items-center gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#F4F7F7]"
            style={{ background: accent, color: onAccent }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight tracking-tight">
              {card.full_name}
            </h1>
            {role && (
              <p className="text-sm font-bold" style={{ color: ink }}>
                {role}
              </p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-rise mt-5 text-[15px] leading-relaxed text-black/60"
            style={{ ["--d" as string]: "70ms" }}
          >
            {card.bio}
          </p>
        )}

        <section
          className="card-rise mt-7 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)]"
          style={{ ["--d" as string]: "130ms" }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: ink }} />
            <h2 className="text-lg font-black tracking-tight">Book a slot</h2>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-black/45">
            {email
              ? "Sends a request by email — you'll get a confirmation back."
              : "No email set on this card yet."}
          </p>

          <form action={email ? `mailto:${email}` : undefined} method="get" className="mt-5">
            <input type="hidden" name="subject" value="Booking request" />

            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-black/40">
              <Clock className="h-3 w-3" />
              preferred time
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SLOTS.map((slot, index) => (
                // The selected slot fills with the accent rather than just
                // recolouring its text, which was too quiet to read as chosen.
                // Tailwind can't see a runtime colour, so it comes via CSS vars.
                <label
                  key={slot}
                  className="cursor-pointer rounded-xl border border-black/12 bg-[#FAFCFC] py-2.5 text-center text-[13px] font-bold transition-colors has-[:checked]:border-transparent has-[:checked]:bg-[var(--slot)] has-[:checked]:text-[var(--slot-fg)]"
                  style={
                    {
                      ["--slot"]: accent,
                      ["--slot-fg"]: onAccent,
                    } as React.CSSProperties
                  }
                >
                  <input
                    type="radio"
                    name="body"
                    value={`Requested time: ${slot}`}
                    defaultChecked={index === 0}
                    disabled={!email}
                    className="sr-only"
                  />
                  {slot}
                </label>
              ))}
            </div>

            <input
              name="cc"
              placeholder="Your email"
              aria-label="Your email"
              disabled={!email}
              className="mt-4 h-13 w-full rounded-xl border border-black/12 bg-[#FAFCFC] px-4 py-3.5 text-[15px] font-semibold outline-none placeholder:text-black/30 focus:border-black/40 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!email}
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-black uppercase tracking-tight transition-transform active:scale-[0.98] disabled:opacity-50"
              style={{ background: accent, color: onAccent }}
            >
              <Send className="h-4 w-4" />
              request booking
            </button>
          </form>
        </section>

        {buttons.length > 0 && (
          <div
            className="card-rise mt-7 flex flex-wrap justify-center gap-2.5"
            style={{ ["--d" as string]: "190ms" }}
          >
            {buttons.map((button, index) => {
              const Icon = iconFor(button.kind);
              return (
                <a
                  key={`${button.href}-${index}`}
                  href={button.href}
                  target={button.external ? "_blank" : undefined}
                  rel={button.external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Icon className="h-4 w-4" style={{ color: ink }} />
                  {button.label}
                </a>
              );
            })}
          </div>
        )}

        <SaveContact
          card={card}
          className="card-rise mt-8 block text-center text-[11px] font-black uppercase tracking-[0.25em] text-black/35 hover:text-black"
          style={{ ["--d" as string]: "250ms" }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
