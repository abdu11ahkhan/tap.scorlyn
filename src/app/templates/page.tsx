import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Sparkles } from "lucide-react";
import { CARD_PURPOSES, CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";
import { createClient } from "@/lib/supabase/server";
import { Marquee } from "@/components/sections/Marquee";
import TemplateGallery from "./TemplateGallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Templates — ScorlynTap",
  description: "Profile cards, landing pages, portfolios, and contact forms.",
};

/** The page's own max width — generous enough for five fluid columns on a
 *  wide desktop without the grid ever needing to know its own width. */
const PAGE_W = 1360;

/** Anything after this index is newer than the original five. */
const ORIGINAL_COUNT = 5;

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
  const [{ data: userData }, { data: overrideRows }] = await Promise.all([
    supabase.auth.getUser(),
    // Admin overrides from template_settings. Readable by anyone (the gallery
    // is public), and absent rows just fall back to the compiled-in definition.
    supabase
      .from("template_settings")
      .select("template_id, enabled, name, category, sort_order, is_new"),
  ]);

  const isLoggedIn = Boolean(userData.user);

  const overrides = new Map(
    (overrideRows ?? []).map((o) => [o.template_id as string, o])
  );

  const templatesAll = CARD_TEMPLATES.map((t, index) => {
    const o = overrides.get(t.id);
    return {
      id: t.id,
      name: o?.name || t.name,
      category: (o?.category as string) || t.category,
      preview: t.preview,
      enabled: o?.enabled ?? true,
      sortOrder: o?.sort_order ?? 0,
      isNew: o?.is_new ?? index >= ORIGINAL_COUNT,
    };
  })
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div className="float-orb pointer-events-none absolute -top-32 left-1/4 h-[600px] w-[700px] rounded-full bg-teal/8 blur-[150px]" />

      <div
        className="relative mx-auto w-full px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20 sm:pb-14"
        style={{ maxWidth: `${PAGE_W}px` }}
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-xs font-black uppercase tracking-widest text-ink-dim transition-colors hover:border-teal hover:text-teal"
        >
          ← ScorlynTap
        </Link>

        {purpose && (
          <p className="card-rise mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-black lowercase text-teal">
            building a {purpose.label} card — pick any template below
          </p>
        )}

        <h1 className="card-rise mx-auto mt-7 max-w-2xl text-[clamp(2.6rem,7vw,4.5rem)] font-black leading-[0.92] tracking-[-0.04em]">
          A template for every card you need to hand over.
        </h1>

        <p
          className="card-rise mx-auto mt-5 max-w-xl text-lg font-medium text-ink-dim"
          style={{ ["--d" as string]: "80ms" }}
        >
          {templatesAll.length} templates, {TEMPLATE_CATEGORIES.length} kinds of card. Editing
          is free; you only need an account to publish.
        </p>

        <div
          className="card-rise mt-6 flex flex-wrap items-center justify-center gap-2"
          style={{ ["--d" as string]: "120ms" }}
        >
          {/* Most people who want a digital card already have a physical
              one with the details laid out on it — reading it beats
              retyping it. */}
          <Link
            href="/templates/scan"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-4 text-sm font-black lowercase text-teal transition-colors hover:border-teal hover:bg-teal/20"
          >
            <Camera className="h-4 w-4" />
            got a business card already? scan it instead
          </Link>
        </div>
      </div>

      <Marquee className="bg-acid text-ink" />

      <section
        className="relative mx-auto w-full px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20"
        style={{ maxWidth: `${PAGE_W}px` }}
      >
        <TemplateGallery
          templates={templatesAll}
          categories={TEMPLATE_CATEGORIES}
          purposeId={purpose?.id ?? null}
        />
      </section>

      <section
        className="relative mx-auto w-full px-4 pb-20 pt-4 text-center sm:px-6 sm:pb-24"
        style={{ maxWidth: `${PAGE_W}px` }}
      >
        <div className="sticker-lg rounded-[2rem] bg-acid p-10 text-ink">
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
            href={`/templates/sticker/edit${purposeQuery}`}
            className="sticker sticker-press mt-7 inline-flex h-14 items-center justify-center rounded-full bg-ink px-10 text-base font-black uppercase tracking-tight text-acid"
          >
            start with sticker
          </Link>
        </div>
      </section>
    </div>
  );
}
