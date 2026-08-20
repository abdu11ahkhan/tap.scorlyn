import { MessageSquare } from "lucide-react";
import {
  roleLine,
  fontStack,
  resolveCardTheme,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

/**
 * FORM — asking for a quote.
 *
 * The page is a prompt: what you do, what you need to know, and one obvious
 * way to send it. The contact links are the form — there is no server here to
 * post to, and a fake input that goes nowhere is worse than none.
 */
export default function QuoteCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#F7F8F8");
  const { accent, onAccent } = theme;
  const role = roleLine(card);

  const asks = [
    "What you need",
    "Roughly when",
    "Where you are",
    "Any budget in mind",
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-16">
        <span
          className="card-rise inline-flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: accent, color: onAccent }}
        >
          <MessageSquare className="h-5 w-5" />
        </span>

        <h1 className="card-rise mt-5 text-[2.3rem] font-bold leading-[1.05] tracking-tight">
          Get a quote from {card.full_name.split(" ")[0]}
        </h1>

        {role && (
          <p className="card-location card-rise mt-2 text-[15px] font-semibold" style={{ color: theme.fgDim }}>
            {role}
            {card.location ? ` · ${card.location}` : ""}
          </p>
        )}

        {card.bio && (
          <p className="card-bio card-rise mt-5 text-[15px] leading-relaxed" style={{ color: theme.fgDim }}>{card.bio}</p>
        )}

        {/* Deliberately fixed dark text: this card is hardcoded white
            regardless of the owner's surface_color, so it can't read
            theme.fg/fgMuted — on a dark-themed card those would resolve to a
            light color and go invisible against this white background. */}
        <section className="card-rise mt-8 rounded-2xl border bg-white p-5 text-[#12141A]" style={{ borderColor: theme.border }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-black/45">
            include in your message
          </p>
          <ul className="mt-3 space-y-2.5">
            {asks.map((ask) => (
              <li key={ask} className="flex items-center gap-3 text-[15px] font-medium">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                {ask}
              </li>
            ))}
          </ul>
        </section>

        <nav className="mt-6 space-y-2.5">
          {buttons.map((button, index) => {
            const Icon = iconFor(button.kind);
            const lead = index === 0;
            return (
              <a
                key={`${button.kind}-${index}`}
                href={button.href}
                target={button.external ? "_blank" : undefined}
                rel={button.external ? "noopener noreferrer" : undefined}
                className={`card-rise flex h-14 items-center gap-3 rounded-xl px-4 text-[15px] font-bold ${
                  lead ? "" : "border bg-white text-[#12141A]"
                }`}
                style={
                  lead
                    ? { background: accent, color: onAccent, ["--d" as string]: `${index * 60}ms` }
                    : { borderColor: theme.border, ["--d" as string]: `${index * 60}ms` }
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {button.label}
              </a>
            );
          })}
        </nav>

        <SaveContact
          card={card}
          className="mt-6 flex h-12 items-center justify-center rounded-xl border bg-white text-[13px] font-bold text-[#12141A]"
          style={{ borderColor: theme.border }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
