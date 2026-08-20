import { Calendar, Clock, Send } from "lucide-react";
import {
  roleLine,
  fontStack,
  initialsOf,
  resolveCardTheme,
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
  const theme = resolveCardTheme(card, "#F4F7F7");
  const { accent, accentText: ink, onAccent } = theme;
  const role = roleLine(card);
  const email = card.email?.trim();

  return (
    <div
      className="grain relative min-h-screen overflow-hidden"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      {card.cover_url && (
        <div className="relative h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.cover_url} alt="" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `linear-gradient(to top, ${theme.surface} 0%, transparent 100%)` }}
          />
        </div>
      )}

      <main className={`mx-auto w-full max-w-md px-6 pb-24 ${card.cover_url ? "-mt-10" : "pt-14"}`}>
        <header className="card-rise relative flex items-center gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="card-avatar flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4"
            style={{ background: accent, color: onAccent, borderColor: theme.surface }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[18px] font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="card-name text-[24px] font-black leading-tight tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="card-headline text-[13px] font-bold" style={{ color: ink }}>{role}</p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-bio card-rise mt-5 text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "70ms" }}
          >{card.bio}</p>
        )}

        <section
          className="card-rise mt-7 rounded-3xl border border-black/10 bg-white p-6 text-[#0F1A1A] shadow-[0_14px_40px_rgba(0,0,0,0.06)]"
          style={{ ["--d" as string]: "130ms" }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: ink }} />
            <h2 className="text-[18px] font-black tracking-tight">Book a slot</h2>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-black/45">
            {email
              ? "Sends a request by email — they'll confirm the time with you directly."
              : "No email set on this card yet."}
          </p>

          <form action={email ? `mailto:${email}` : undefined} method="get" className="mt-5">
            <input type="hidden" name="subject" value="Booking request" />

            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-black/35">
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
                  className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-black/12 bg-[#FAFCFC] text-center text-[13px] font-bold transition-colors has-[:checked]:border-transparent has-[:checked]:bg-[var(--slot)] has-[:checked]:text-[var(--slot-fg)]"
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
              placeholder="Your email (optional)"
              aria-label="Your email (optional)"
              disabled={!email}
              className="mt-4 h-13 w-full rounded-xl border border-black/12 bg-[#FAFCFC] px-4 py-3.5 text-[15px] font-semibold outline-none placeholder:text-black/25 focus:border-black/40 disabled:opacity-50"
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
                  className="flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 text-[13px] font-bold text-[#0F1A1A] transition-all hover:-translate-y-0.5 hover:shadow-md"
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
          className="card-rise mt-8 flex min-h-11 items-center justify-center text-center text-[11px] font-black uppercase tracking-[0.25em] transition-colors hover:[color:var(--hover-fg)]"
          style={{ color: theme.fgMuted, ["--hover-fg" as string]: theme.fg, ["--d" as string]: "250ms" }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
