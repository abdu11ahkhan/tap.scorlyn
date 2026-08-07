import { ArrowUpRight } from "lucide-react";
import {
  fontStack,
  readableOn,
  resolveGallery,
  type CardProfile,
  type ResolvedButton,
} from "@/lib/card";
import SaveContact from "./SaveContact";

/**
 * PORTFOLIO — one project, told properly.
 *
 * A numbered run of image-and-caption pairs rather than a gallery. For work
 * that needs explaining — a rebrand, a build, a renovation — where the
 * captions carry as much as the pictures.
 */
export default function CaseCard({
  card,
  buttons,
}: {
  card: CardProfile;
  buttons: ResolvedButton[];
}) {
  const accent = card.accent_color || "#1D4ED8";
  const gallery = resolveGallery(card.gallery);

  return (
    <div
      className="min-h-screen bg-white text-[#111]"
      style={{ fontFamily: fontStack(card.font) }}
    >
      <main className="mx-auto w-full max-w-md px-6 pb-24 pt-16">
        <p
          className="card-rise text-[11px] font-bold uppercase tracking-[0.28em]"
          style={{ color: accent }}
        >
          {card.company || "Selected work"}
        </p>

        <h1
          className="card-rise mt-3 text-[2.4rem] font-bold leading-[1.05] tracking-tight"
          style={{ ["--d" as string]: "60ms" }}
        >
          {card.full_name}
        </h1>

        {card.headline && (
          <p
            className="card-rise mt-2 text-[15px] font-semibold text-neutral-500"
            style={{ ["--d" as string]: "110ms" }}
          >
            {card.headline}
            {card.location ? ` · ${card.location}` : ""}
          </p>
        )}

        {card.bio && (
          <p
            className="card-rise mt-6 border-l-2 pl-4 text-[16px] leading-relaxed text-neutral-700"
            style={{ borderColor: accent, ["--d" as string]: "160ms" }}
          >
            {card.bio}
          </p>
        )}

        {gallery.length > 0 && (
          <div className="mt-10 space-y-10">
            {gallery.map((item, index) => (
              <section
                key={index}
                className="card-rise"
                style={{ ["--d" as string]: `${200 + index * 70}ms` }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: accent }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1" style={{ background: `${accent}33` }} />
                </div>

                <div className="mt-3 overflow-hidden rounded-lg bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption ?? ""} className="w-full" />
                </div>

                {item.caption && (
                  <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
                    {item.caption}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        <nav className="mt-12 space-y-2.5">
          {buttons.map((button, index) => (
            <a
              key={`${button.kind}-${index}`}
              href={button.href}
              target={button.external ? "_blank" : undefined}
              rel={button.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3.5 text-[15px] font-semibold transition-colors hover:border-neutral-900"
            >
              {button.label}
              <ArrowUpRight className="h-4 w-4 text-neutral-400" />
            </a>
          ))}
        </nav>

        <SaveContact
          card={card}
          className="mt-6 flex h-12 items-center justify-center rounded-lg text-sm font-bold"
          style={{ background: accent, color: readableOn(accent) }}
        >
          Save to contacts
        </SaveContact>
      </main>
    </div>
  );
}
