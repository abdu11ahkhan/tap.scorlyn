import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, Sparkles, User } from "lucide-react";
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";
import { DEMO_PERSONAS } from "@/app/preview/card/[template]/demo-data";
import { createClient } from "@/lib/supabase/server";
import { Marquee } from "@/components/sections/Marquee";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Templates — Tapzar",
  description: "Profile cards, landing pages, portfolios, and contact forms.",
};

// Previews render at real phone dimensions, then scale down into the frame.
// The iframe keeps a full 844px viewport so templates lay out as they really
// would; the frame is deliberately shorter than the scaled result and crops it.
// At full height each card ran ~780px tall, so barely one row fit on screen.
// Whole pixels throughout: a fractional card width (320.4px x3) overflowed a
// 1025px column by 0.2px and silently wrapped the row to two cards.
const FRAME_W = 296;
const FRAME_H = 470;
const CARD_W = FRAME_W + 24; // + frame padding
const GAP = 32;

/**
 * Exactly three cards plus their gaps, with a few px of slack. Every section
 * header, card row and the page header share this width, so headings line up
 * with the first card instead of sitting in a wider container.
 */
const COLUMN_W = CARD_W * 3 + GAP * 2 + 4;

/** Anything after this index is newer than the original five. */
const ORIGINAL_COUNT = 5;

export default async function PublicTemplatesPage() {
  // Anyone can browse. We only read the session to decide what the footer says.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user);

  // Admin overrides from template_settings. Readable by anyone (the gallery is
  // public), and absent rows just fall back to the compiled-in definition.
  const { data: overrideRows } = await supabase
    .from("template_settings")
    .select("template_id, enabled, name, blurb, category, sort_order, is_new");

  const overrides = new Map(
    (overrideRows ?? []).map((o) => [o.template_id as string, o])
  );

  const templatesAll = CARD_TEMPLATES.map((t, index) => {
    const o = overrides.get(t.id);
    return {
      ...t,
      name: o?.name || t.name,
      blurb: o?.blurb || t.blurb,
      category: (o?.category as string) || t.category,
      enabled: o?.enabled ?? true,
      sortOrder: o?.sort_order ?? 0,
      isNew: o?.is_new ?? index >= ORIGINAL_COUNT,
    };
  })
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="float-orb pointer-events-none absolute -top-32 left-1/4 h-[600px] w-[700px] rounded-full bg-acid/20 blur-[150px]" />
      <div
        className="float-orb pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-hotpink/20 blur-[150px]"
        style={{ ["--d" as string]: "4s" }}
      />
      <div
        className="float-orb pointer-events-none absolute bottom-1/4 left-0 h-[460px] w-[460px] rounded-full bg-violet-pop/20 blur-[150px]"
        style={{ ["--d" as string]: "7s" }}
      />

      <div
        className="relative mx-auto w-full px-6 pt-20 pb-14"
        style={{ maxWidth: `${COLUMN_W + 48}px` }}
      >
        <header className="max-w-3xl">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/20 px-4 text-xs font-black uppercase tracking-widest text-white/60 transition-colors hover:border-acid hover:text-acid"
          >
            ← tapzar
          </Link>

          <h1 className="card-rise mt-7 text-[clamp(2.8rem,8vw,5.5rem)] font-black leading-[0.86] tracking-[-0.05em]">
            <span className="text-acid">{templatesAll.length}</span> templates.
            <br />
            {TEMPLATE_CATEGORIES.length} sectors.
          </h1>

          <p
            className="card-rise mt-6 max-w-xl text-lg font-medium text-white/60"
            style={{ ["--d" as string]: "80ms" }}
          >
            Start from the kind of page you need — a tap card, a landing page, a
            portfolio, a form. Editing is free; you only need an account to publish.
          </p>

          {/* Sector jump links. Plain anchors — a server page shouldn't ship
              client-side filtering for a list this size. */}
          <div
            className="card-rise mt-8 flex flex-wrap gap-2"
            style={{ ["--d" as string]: "140ms" }}
          >
            {TEMPLATE_CATEGORIES.map((category) => {
              const count = templatesAll.filter(
                (t) => t.category === category.id
              ).length;
              return (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className="group inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2 text-sm font-black lowercase text-white/60 transition-colors hover:border-acid hover:bg-acid hover:text-ink"
                >
                  {category.name}
                  <span className="rounded-full bg-white/10 px-1.5 text-[11px] group-hover:bg-ink/15">
                    {count}
                  </span>
                </a>
              );
            })}
          </div>
        </header>
      </div>

      <Marquee className="bg-acid text-ink" />

      {/* ------------------------------------------------------------------
          One block per sector.
          ------------------------------------------------------------------ */}
      {TEMPLATE_CATEGORIES.map((category, categoryIndex) => {
        const templates = templatesAll.filter((t) => t.category === category.id);
        if (templates.length === 0) return null;

        return (
          <section
            key={category.id}
            id={category.id}
            className="relative mx-auto w-full scroll-mt-6 px-6 pt-16 pb-4"
            style={{ maxWidth: `${COLUMN_W + 48}px` }}
          >
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-white/10 pb-5">
              <div className="flex items-start gap-4">
                {/* Big sector numeral gives the page a spine as you scroll. */}
                <span className="text-5xl font-black leading-[0.8] tracking-tighter text-white/10 sm:text-6xl">
                  {String(categoryIndex + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-3xl font-black lowercase tracking-tighter sm:text-4xl">
                    {category.name}
                  </h2>
                  <p className="mt-1.5 max-w-md text-sm font-medium text-white/50">
                    {category.blurb}
                  </p>
                </div>
              </div>
              <span className="rounded-full border-2 border-white/15 px-3 py-1 text-xs font-black text-white/40">
                {templates.length} {templates.length === 1 ? "template" : "templates"}
              </span>
            </div>

            {/* Flex-wrap rather than a grid: sectors hold anywhere from one to
                ten templates, and a 3-column grid leaves a lopsided hole beside
                the short ones. Centred wrapping keeps every row balanced. */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-12">
              {templates.map((template, index) => {
                const accent = template.preview;
                const isNew = template.isNew;
                const persona = DEMO_PERSONAS[template.id];
                const previewHref = `/preview/card/${template.id}?accent=${encodeURIComponent(accent)}`;

                return (
                  // flex column + mt-auto on the actions: blurbs wrap to
                  // different heights, which left the Customise buttons at
                  // ragged heights across a row.
                  <article
                    key={template.id}
                    className="card-rise group flex flex-col"
                    style={{
                      ["--d" as string]: `${(index % 3) * 90}ms`,
                      width: `${CARD_W}px`,
                    }}
                  >
                    {/* No static tilt: rotating a container forces its whole
                        subtree — the iframe included — to be resampled, which
                        left every preview visibly soft. The lift on hover is
                        transform too, but only while hovered. */}
                    <div
                      className="relative rounded-[2rem] border-2 border-ink bg-white/[0.03] p-3 transition-all duration-300 group-hover:-translate-y-2"
                      style={{ boxShadow: `7px 7px 0 0 ${accent}` }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                        style={{ background: accent }}
                      />

                      {isNew && (
                        <span className="sticker absolute -right-2 -top-3 z-20 rotate-3 rounded-full border-2 border-ink bg-acid px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ink">
                          new
                        </span>
                      )}

                      {/* The whole preview is a link — clicking the card is the
                          obvious gesture, the eye button was easy to miss. */}
                      <Link
                        href={previewHref}
                        aria-label={`View the ${template.name} template`}
                        className="group/frame relative block overflow-hidden rounded-[1.4rem] bg-black"
                        style={{ width: `${FRAME_W}px`, height: `${FRAME_H}px` }}
                      >
                        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-ink/70 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/frame:opacity-100">
                          <span className="sticker flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 py-2.5 text-sm font-black uppercase tracking-tight text-ink">
                            <Eye className="h-4 w-4" />
                            view
                          </span>
                        </span>
                        {/* Rendered at the frame's real size rather than at
                            390px and scaled down. Scaling an iframe rasterises
                            it first, so the text came out soft; at native size
                            the templates just lay out for a narrow viewport and
                            stay pin sharp. */}
                        {/* raw=1 skips the preview page's device-toggle chrome
                            — the thumbnail wants the card alone. */}
                        <iframe
                          src={`/preview/card/${template.id}?accent=${encodeURIComponent(accent)}&raw=1`}
                          title={`${template.name} template preview`}
                          loading="lazy"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-0 border-0"
                          style={{ width: `${FRAME_W}px`, height: `${FRAME_H}px` }}
                        />

                        {/* These pages are taller than one phone screen, so the
                            preview always cuts off. A frosted bar reads as
                            deliberate chrome — a black fade would smear over
                            the light templates like a stain. */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-9 items-center justify-center border-t border-white/15 bg-ink/70 backdrop-blur-md">
                          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">
                            scrolls on
                          </span>
                        </div>
                      </Link>
                    </div>

                    <div className="mt-5 flex flex-1 flex-col px-1">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink"
                          style={{ background: accent }}
                        />
                        <h3 className="text-2xl font-black lowercase tracking-tight transition-colors group-hover:text-acid">
                          {template.name}
                        </h3>
                        <span className="ml-auto rounded-full border-2 border-white/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white/40">
                          {template.vibe}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-medium leading-relaxed text-white/50">
                        {template.blurb}
                      </p>

                      {/* Who the preview is showing. Makes it obvious the
                          templates suit different trades, not just palettes. */}
                      {persona && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-white/30">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {persona.headline} · {persona.location}
                          </span>
                        </p>
                      )}

                      <div className="mt-auto flex items-center gap-2 pt-4">
                        <Link
                          href={`/templates/${template.id}/edit`}
                          className="sticker sticker-press group/btn inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid text-sm font-black uppercase tracking-tight text-ink"
                        >
                          customise
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>

                        <Link
                          href={previewHref}
                          target="_blank"
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 text-white/70 transition-colors hover:border-acid hover:text-acid"
                          title="Open full preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <section
        className="relative mx-auto w-full px-6 pb-24 pt-20 text-center"
        style={{ maxWidth: `${COLUMN_W + 48}px` }}
      >
        <div className="sticker-lg rounded-[2rem] border-2 border-ink bg-acid p-10 text-ink">
          <Sparkles className="mx-auto h-7 w-7" />
          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tighter sm:text-4xl">
            can&apos;t decide? just start.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] font-semibold opacity-70">
            You can switch template any time — your details carry across every one
            of them.
            {!isLoggedIn && " Editing is free; sign in only when you publish."}
          </p>
          <Link
            href="/templates/sticker/edit"
            className="sticker sticker-press mt-7 inline-flex h-14 items-center justify-center rounded-full border-2 border-ink bg-ink px-10 text-base font-black uppercase tracking-tight text-acid"
          >
            start with sticker
          </Link>
        </div>
      </section>
    </div>
  );
}
