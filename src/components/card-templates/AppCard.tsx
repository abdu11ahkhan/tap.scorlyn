import { ArrowRight, Check, Star } from "lucide-react";
import {
  fontStack,
  initialsOf,
  readableOn,
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
  const accent = card.accent_color || "#2563EB";
  const onAccent = readableOn(accent);
  const [primary, ...rest] = buttons;
  const shot = card.cover_url;

  return (
    <div
      className="min-h-screen bg-[#F6F7FB] text-[#0F172A]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-14">
        {/* App header row */}
        <header className="card-rise flex items-center gap-4" style={{ ["--d" as string]: "0ms" }}>
          <div
            className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] shadow-lg"
            style={{ background: accent, color: onAccent }}
          >
            {card.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-black">{initialsOf(card.full_name)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-black tracking-tight">{card.full_name}</h1>
            {card.headline && (
              <p className="truncate text-[13px] font-semibold text-black/50">
                {card.headline}
              </p>
            )}
            <div className="mt-1 flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className="h-3 w-3"
                  style={{ color: accent, fill: i < 4 ? accent : "transparent" }}
                />
              ))}
              <span className="ml-1 text-[11px] font-bold text-black/40">4.8</span>
            </div>
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
            className="card-rise mt-7 text-[15px] leading-relaxed text-black/65"
            style={{ ["--d" as string]: "190ms" }}
          >
            {card.bio}
          </p>
        )}

        {rest.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-black/35">
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
                      className="card-rise flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ ["--d" as string]: `${230 + index * 55}ms` }}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${accent}1F`, color: accent }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{button.label}</span>
                      <Check className="h-4 w-4 text-black/20" strokeWidth={3} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <SaveContact
          card={card}
          className="card-rise mt-8 block text-center text-[11px] font-black uppercase tracking-[0.25em] text-black/35 hover:text-black"
          style={{ ["--d" as string]: "420ms" }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
