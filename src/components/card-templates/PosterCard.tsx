import { ArrowRight, MapPin } from "lucide-react";
import {
  fontStack,
  readableOn,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import { iconFor } from "./button-icons";
import SaveContact from "./SaveContact";

import BackgroundEffect from "./BackgroundEffect";
/**
 * LANDING — the cover photo is the whole design.
 *
 * Type sits straight on the image with a scrim behind it, so it stays readable
 * whatever photo gets uploaded. Falls back to an accent gradient with no image.
 */
export default function PosterCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#F43F5E";
  const onAccent = readableOn(accent);
  const [primary, ...rest] = buttons;
  const cover = card.cover_url || card.avatar_url;
  // The root's own bg-ink is cleared to transparent by the .card-surface
  // wrapper when a surface colour is chosen, but the photo scrim sits inside
  // a `fixed` layer of its own and needs to read the chosen surface itself.
  const tone = card.surface_color?.trim() || "#0A0A0A";

  return (
    <div
      className="grain relative min-h-screen bg-ink text-white overflow-hidden"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <BackgroundEffect effect={card.background_effect} accent={accent} />

      {/* Photo */}
      <div className="fixed inset-0">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="gradient-pan h-full w-full"
            style={{
              backgroundImage: `radial-gradient(at 25% 20%, ${accent} 0px, transparent 60%), radial-gradient(at 75% 80%, ${accent}88 0px, transparent 60%)`,
            }}
          />
        )}
        {/* Scrim: any uploaded photo has to sit under white type. */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `linear-gradient(to top, ${tone} 0%, ${tone}B3 55%, ${tone}4D 100%)` }}
        />
      </div>

      <main className="relative flex min-h-screen w-full max-w-md flex-col justify-end px-6 pb-16 pt-24 mx-auto">
        <span
          className="card-company card-rise inline-block w-fit max-w-full truncate rounded-full border-2 border-ink px-4 py-1.5 text-[11px] font-black uppercase tracking-widest"
          style={{ background: accent, color: onAccent, ["--d" as string]: "0ms" }}
        >{card.company || "featured"}</span>

        <h1
          className="card-name card-rise mt-5 text-[3.4rem] font-black uppercase leading-[0.9] tracking-tighter"
          style={{ ["--d" as string]: "70ms" }}
        >{card.full_name}</h1>

        {card.headline && (
          <p
            className="card-headline card-rise mt-4 text-[18px] font-bold leading-snug text-white/80"
            style={{ ["--d" as string]: "130ms" }}
          >{card.headline}</p>
        )}

        {card.location && (
          <p
            className="card-location card-rise mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-white/45"
            style={{ ["--d" as string]: "170ms" }}
          >
            <MapPin className="h-4 w-4" />
            {card.location}
          </p>
        )}

        {card.bio && (
          <p
            className="card-bio card-rise mt-5 text-[15px] leading-relaxed text-white/60"
            style={{ ["--d" as string]: "210ms" }}
          >{card.bio}</p>
        )}

        {primary && (
          <a
            href={primary.href}
            target={primary.external ? "_blank" : undefined}
            rel={primary.external ? "noopener noreferrer" : undefined}
            className="card-rise sticker-lg sticker-press mt-8 inline-flex h-16 items-center justify-center gap-2 rounded-full border-2 border-ink text-[18px] font-black uppercase tracking-tight"
            style={{ background: accent, color: onAccent, ["--d" as string]: "260ms" }}
          >
            {primary.label}
            <ArrowRight className="h-5 w-5" />
          </a>
        )}

        {rest.length > 0 && (
          <div
            className="card-rise mt-6 flex flex-wrap gap-2.5"
            style={{ ["--d" as string]: "310ms" }}
          >
            {rest.map((button, index) => {
              const Icon = iconFor(button.kind);
              return (
                <a
                  key={`${button.href}-${index}`}
                  href={button.href}
                  target={button.external ? "_blank" : undefined}
                  rel={button.external ? "noopener noreferrer" : undefined}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-[13px] font-bold backdrop-blur-xl transition-colors hover:bg-white/25"
                >
                  <Icon className="h-4 w-4" />
                  {button.label}
                </a>
              );
            })}
          </div>
        )}

        <SaveContact
          card={card}
          className="card-rise mt-8 text-[11px] font-black uppercase tracking-[0.25em] text-white/35 hover:text-white"
          style={{ ["--d" as string]: "360ms" }}
        >
          save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
