import { Send } from "lucide-react";
import {
  fontStack,
  initialsOf,
  readableOn,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";

/**
 * FORM — built to get a reply.
 *
 * The message box is the hero. There's no server here, so the form is a
 * mailto: GET — it opens the visitor's mail app pre-addressed with their text
 * as the body. Works offline, needs no API key, and can't silently drop mail.
 */
export default function ReplyCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#7C3AED";
  const onAccent = readableOn(accent);
  const email = card.email?.trim();

  return (
    <div
      className="min-h-screen bg-[#F7F7FB] text-[#111]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-16">
        <header
          className="card-rise flex items-center gap-4"
          style={{ ["--d" as string]: "0ms" }}
        >
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: accent, color: onAccent }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.avatar_url}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight tracking-tight">
              {card.full_name}
            </h1>
            {card.headline && (
              <p className="text-sm font-bold" style={{ color: accent }}>
                {card.headline}
              </p>
            )}
          </div>
        </header>

        {card.bio && (
          <p
            className="card-rise mt-6 text-[15px] leading-relaxed text-black/60"
            style={{ ["--d" as string]: "70ms" }}
          >
            {card.bio}
          </p>
        )}

        {/* The form is the point of this template. */}
        <section
          className="card-rise mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)]"
          style={{ ["--d" as string]: "130ms" }}
        >
          <h2 className="text-lg font-black tracking-tight">Send a message</h2>
          <p className="mt-1 text-[13px] font-semibold text-black/45">
            {email
              ? "Opens in your mail app — nothing is stored here."
              : "No email set on this card yet."}
          </p>

          <form
            action={email ? `mailto:${email}` : undefined}
            method="get"
            className="mt-5 space-y-3"
          >
            <input
              name="subject"
              required
              placeholder="Subject"
              aria-label="Subject"
              disabled={!email}
              className="h-13 w-full rounded-xl border border-black/12 bg-[#FAFAFC] px-4 py-3.5 text-[15px] font-semibold outline-none placeholder:text-black/30 focus:border-black/40 disabled:opacity-50"
            />
            <textarea
              name="body"
              required
              rows={4}
              placeholder="What's on your mind?"
              aria-label="Message"
              disabled={!email}
              className="w-full resize-none rounded-xl border border-black/12 bg-[#FAFAFC] px-4 py-3.5 text-[15px] font-semibold outline-none placeholder:text-black/30 focus:border-black/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!email}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-black uppercase tracking-tight transition-transform active:scale-[0.98] disabled:opacity-50"
              style={{ background: accent, color: onAccent }}
            >
              <Send className="h-4 w-4" />
              send
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
                  <Icon className="h-4 w-4" style={{ color: accent }} />
                  {button.label}
                </a>
              );
            })}
          </div>
        )}

        <a
          href={`/api/vcard/${card.username}`}
          className="card-rise mt-8 block text-center text-[11px] font-black uppercase tracking-[0.25em] text-black/35 hover:text-black"
          style={{ ["--d" as string]: "250ms" }}
        >
          save to contacts
        </a>
      </main>
    </div>
  );
}
