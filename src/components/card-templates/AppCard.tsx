import { ArrowRight, Check } from "lucide-react";
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

/**
 * LANDING — app-store shaped. Icon, rating, screenshot, feature list, download.
 * The cover image is used as the product shot.
 */
export default function AppCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const theme = resolveCardTheme(card, "#F6F7FB");
  const { accent, accentText: ink, onAccent } = theme;
  const role = roleLine(card);
  const [primary, ...rest] = buttons;
  const shot = card.cover_url;

  return (
    <div
      className="min-h-screen"
      style={{ background: theme.surface, color: theme.fg, fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-14">
        {/* App header row */}
        <header className="card-rise flex items-center gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[18px] shadow-lg"
            style={{ background: accent, color: onAccent }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[18px] font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="card-name truncate text-[18px] font-black tracking-tight">{card.full_name}</h1>
            {role && (
              <p className="card-headline truncate text-[13px] font-semibold" style={{ color: theme.fgDim }}>{role}</p>
            )}
            {card.company && (
              <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: ink }}>{card.company}</p>
            )}
          </div>
        </header>

        {primary && (
          <a
            href={primary.href}
            target={primary.external ? "_blank" : undefined}
            rel={primary.external ? "noopener noreferrer" : undefined}
            className="card-rise mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl text-[15px] font-black uppercase tracking-tight shadow-lg transition-transform active:scale-[0.98]"
            style={{ background: accent, color: onAccent, ["--d" as string]: "70ms" }}
          >
            {primary.label}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}

        {/* Product shot */}
        <div
          className="card-rise mt-7 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.08)]"
          style={{ ["--d" as string]: "130ms" }}
        >
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="" className="h-56 w-full object-cover" />
          ) : (
            <div
              className="flex h-56 w-full items-center justify-center"
              style={{ background: `linear-gradient(140deg, ${accent}22, ${accent}08)` }}
            >
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-black/25">
                add a cover photo
              </span>
            </div>
          )}
        </div>

        {card.bio && (
          <p
            className="card-bio card-rise mt-7 text-[15px] leading-relaxed"
            style={{ color: theme.fgDim, ["--d" as string]: "190ms" }}
          >{card.bio}</p>
        )}

        {rest.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: theme.fgMuted }}>
              what you get
            </h2>
            <ul className="mt-4 space-y-2.5">
              {rest.map((button, index) => {
                const Icon = iconFor(button.kind);
                return (
                  <li key={`${button.href}-${index}`}>
                    <a
                      href={button.href}
                      target={button.external ? "_blank" : undefined}
                      rel={button.external ? "noopener noreferrer" : undefined}
                      className="card-rise flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] font-bold text-[#0F172A] transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ ["--d" as string]: `${230 + index * 55}ms` }}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${accent}1F`, color: ink }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{button.label}</span>
                      <Check className="h-4 w-4 text-black/25" strokeWidth={3} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <SaveContact
          card={card}
          className="card-rise mt-8 block text-center text-[11px] font-black uppercase tracking-[0.25em] transition-colors hover:[color:var(--hover-fg)]"
          style={{ color: theme.fgMuted, ["--hover-fg" as string]: theme.fg, ["--d" as string]: "420ms" }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
