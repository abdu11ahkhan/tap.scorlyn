import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Camera, LayoutTemplate, Sparkles } from "lucide-react";
import { CARD_PURPOSES, CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";
import { TEMPLATE_TONE } from "@/components/card-templates";
import { createClient } from "@/lib/supabase/server";
import { Marquee } from "@/components/sections/Marquee";
import { Navbar } from "@/components/layout/Navbar";
import SiteFooter from "@/components/layout/SiteFooter";
import TemplateGallery from "./TemplateGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Templates — ScorlynTap",
  description: "Profile cards, landing pages, portfolios, and contact forms.",
};

/** The page's own max width — generous enough for five fluid columns on a
 *  wide desktop without the grid ever needing to know its own width. */
const PAGE_W = 1360;

export default async function PublicTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ purpose?: string }>;
}) {
  // Set when arriving from /single/new — carried through to the editor so a
  // template pick continues the single-purpose flow instead of starting a
  // normal profile card.
  const { purpose: purposeId } = await searchParams;
  const purpose = CARD_PURPOSES.find((p) => p.id === purposeId) ?? null;
  const purposeQuery = purpose ? `?purpose=${purpose.id}` : "";

  // Anyone can browse. We only read the session to decide what the footer says.
  const supabase = await createClient();

  // Independent of each other, so they go together rather than one after the
  // other — the session is only read to decide what the footer says, and the
  // overrides don't depend on who is asking.
  const [{ data: userData }, { data: overrideRows }, { data: settings }] = await Promise.all([
    supabase.auth.getUser(),
    // Admin overrides from template_settings. Readable by anyone (the gallery
    // is public), and absent rows just fall back to the compiled-in definition.
    supabase
      .from("template_settings")
      .select("template_id, enabled, name, category, sort_order"),
    // Footer contact details — same source the homepage footer reads.
    supabase.from("app_settings").select("support_whatsapp, support_email").maybeSingle(),
  ]);

  const isLoggedIn = Boolean(userData.user);

  const overrides = new Map(
    (overrideRows ?? []).map((o) => [o.template_id as string, o])
  );

  const templatesAll = CARD_TEMPLATES.map((t) => {
    const o = overrides.get(t.id);
    return {
      id: t.id,
      name: o?.name || t.name,
      category: (o?.category as string) || t.category,
      preview: t.preview,
      tone: TEMPLATE_TONE[t.id] ?? "#ffffff",
      enabled: o?.enabled ?? true,
      sortOrder: o?.sort_order ?? 0,
    };
  })
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-cream text-char">
      <Navbar />

      {/* Poster hero — same sea dot-grid band the homepage opens with, so
          this reads as the next page of the same site. pt clears the fixed
          72px Navbar. */}
      <section className="dot-grid-light relative overflow-hidden border-b-[3px] border-char bg-sea pb-14 pt-[calc(72px+3rem)] sm:pb-20 sm:pt-[calc(72px+4.5rem)]">
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute right-[8%] top-[34%] hidden h-10 w-10 text-sun sm:block">
          <path fill="currentColor" d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
        </svg>
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-[6%] top-[62%] hidden h-7 w-7 text-white sm:block">
          <path fill="currentColor" d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
        </svg>
        <div className="relative mx-auto w-full px-5 text-center sm:px-6" style={{ maxWidth: `${PAGE_W}px` }}>
          {purpose ? (
            <p className="brut-sm mx-auto inline-flex min-h-10 -rotate-1 items-center gap-2 rounded-full bg-sun px-4 text-[13px] font-black uppercase tracking-tight text-char">
              <Sparkles className="h-4 w-4" />
              building a {purpose.label} card — pick any design
            </p>
          ) : (
            <p className="brut-sm mx-auto inline-flex min-h-10 -rotate-1 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-black uppercase tracking-tight text-char">
              <LayoutTemplate className="h-4 w-4" />
              {templatesAll.length} designs · {TEMPLATE_CATEGORIES.length} kinds of card
            </p>
          )}

          <h1 className="display mt-7 text-[clamp(3.2rem,11vw,7rem)] text-white">
            Pick a{" "}
            <span className="brut inline-block -rotate-2 bg-white px-4 pt-1 text-sun">design</span>
            <br />
            make it yours
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg font-bold leading-snug text-white/90">
            Tap any design to preview it. Editing is free — you only need an account to publish.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#gallery"
              className="brut brut-press inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-sun px-8 text-base font-black uppercase tracking-tight text-char sm:w-auto"
            >
              browse designs
              <ArrowDown className="h-4 w-4" />
            </a>
            {/* Most people who want a digital card already have a physical
                one with the details laid out on it — reading it beats
                retyping it. */}
            <Link
              href="/templates/scan"
              className="brut brut-press inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-black uppercase tracking-tight text-char sm:w-auto"
            >
              <Camera className="h-4 w-4 shrink-0" />
              scan your old card
            </Link>
          </div>
        </div>
      </section>

      <Marquee className="bg-sun text-char" />

      <section
        id="gallery"
        className="dot-grid relative scroll-mt-20 border-b-[3px] border-char"
      >
        <div
          className="relative mx-auto w-full px-5 pb-20 pt-14 sm:px-6 sm:pt-20"
          style={{ maxWidth: `${PAGE_W}px` }}
        >
          <TemplateGallery
            templates={templatesAll}
            categories={TEMPLATE_CATEGORIES}
            purposeId={purpose?.id ?? null}
          />
        </div>
      </section>

      <section className="dot-grid-light relative border-b-[3px] border-char bg-sea px-5 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="display text-[clamp(2.8rem,9vw,5.5rem)] text-white">
          Can&apos;t{" "}
          <span className="brut inline-block -rotate-2 bg-white px-3 pt-1 text-sun">decide?</span>
          <br />
          just start.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg font-bold leading-snug text-white/90">
          You can switch design any time — your details carry across every one of them.
          {!isLoggedIn && " Sign in only when you publish."}
        </p>
        <Link
          href={`/templates/sticker/edit${purposeQuery}`}
          className="brut brut-press mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-sun px-10 text-base font-black uppercase tracking-tight text-char sm:w-auto"
        >
          start with sticker
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <SiteFooter whatsapp={settings?.support_whatsapp} email={settings?.support_email} />
    </div>
  );
}
