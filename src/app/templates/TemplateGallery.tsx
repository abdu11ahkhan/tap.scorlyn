"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import PosterTitle from "@/components/sections/PosterTitle";
import TemplateThumb from "./TemplateThumb";
import { SRC_H, SRC_W } from "./thumb-geometry";
import { thumbTop } from "./thumb-frames";

const THUMB_ASPECT = SRC_H / SRC_W;

type GalleryTemplate = {
  id: string;
  name: string;
  category: string;
  /** Every TEMPLATE_AUDIENCES group this design fits — a design can fit more than one. */
  audiences: readonly string[];
  preview: string;
  /** The template's own background, so a slow-loading thumbnail shows the
   *  right colour instead of a flat black box while its iframe loads. */
  tone: string;
};

type GalleryGroup = { id: string; name: string; blurb?: string };

/** Which lens the pill row is filtering by. "need" (what are you making this
 *  for) is the default; "style" is the old structural grouping, kept one tap
 *  away rather than removed — both read the same `active`/"all" state, reset
 *  when you switch lenses. */
type Mode = "need" | "style";

/**
 * linktr.ee/s/templates' format: one pill row filters a single flat grid in
 * place — pick a group and the grid swaps instantly, no navigation, no
 * per-category scroll. That instant swap is the whole point of the format,
 * which is what makes this a client component rather than the old page's
 * server-rendered anchor links into one section per category.
 */
export default function TemplateGallery({
  templates,
  audiences,
  categories,
  purposeId,
}: {
  templates: GalleryTemplate[];
  /** "What are you making this for?" — the default lens. */
  audiences: readonly GalleryGroup[];
  /** "What shape should the page be?" — the old structural lens, still one tap away. */
  categories: readonly GalleryGroup[];
  purposeId: string | null;
}) {
  const [mode, setMode] = useState<Mode>("need");
  const [active, setActive] = useState<string>("all");

  const groups = mode === "need" ? audiences : categories;
  const inGroup = (t: GalleryTemplate, groupId: string) =>
    mode === "need" ? t.audiences.includes(groupId) : t.category === groupId;

  const visible = useMemo(
    () => (active === "all" ? templates : templates.filter((t) => inGroup(t, active))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templates, active, mode]
  );

  const purposeQuery = purposeId ? `&purpose=${encodeURIComponent(purposeId)}` : "";
  const editQuery = purposeId ? `?purpose=${encodeURIComponent(purposeId)}` : "";
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of groups) m.set(g.id, templates.filter((t) => inGroup(t, g.id)).length);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, mode]);
  const activeName = active === "all" ? null : groups.find((g) => g.id === active)?.name;

  const switchMode = (next: Mode) => {
    setMode(next);
    setActive("all");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PosterTitle lead={activeName ?? "All"} accent="designs" variant="outline" />
        <p className="display text-[28px] text-char/60">
          {visible.length} {visible.length === 1 ? "design" : "designs"}
        </p>
      </div>

      {/* The two lenses over the same 48 designs. "What you're making this
          for" is the default tab; "design style" (the old structural
          grouping) is one tap away, not gone — every design stays reachable
          from either, plus "all" in both. */}
      <div className="mt-6 flex gap-1.5" role="tablist" aria-label="Browse by">
        <ModeTab label="what you need" active={mode === "need"} onClick={() => switchMode("need")} />
        <ModeTab label="design style" active={mode === "style"} onClick={() => switchMode("style")} />
      </div>

      {/* Horizontal scroll on mobile rather than wrapping, so a row of tabs
          that can't fit 390px doesn't stack into a ragged block. Negative
          margin lets it bleed to the screen edge; pt/pb leave room for the
          hard shadow. */}
      <div
        className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-3 pt-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        role="tablist"
        aria-label={mode === "need" ? "Filter templates by what you need" : "Filter templates by design style"}
      >
        <FilterPill label="all" count={templates.length} active={active === "all"} onClick={() => setActive("all")} />
        {groups.map((group) =>
          counts.get(group.id) ? (
            <FilterPill
              key={group.id}
              label={group.name}
              count={counts.get(group.id) ?? 0}
              active={active === group.id}
              onClick={() => setActive(group.id)}
            />
          ) : null
        )}
      </div>
      {activeName && (
        <p className="mt-2 px-1 text-[13px] font-semibold text-char/60">
          {groups.find((g) => g.id === active)?.blurb}
        </p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((template) => {
          const previewHref = `/preview/card/${template.id}?accent=${encodeURIComponent(template.preview)}${purposeQuery}`;

          return (
            <article
              key={template.id}
              className="card-rise brut group flex min-w-0 flex-col overflow-hidden rounded-[1.4rem] bg-white transition-transform duration-300 hover:-translate-y-1.5"
            >
              {/* The lift is transform-only, so it never resamples the
                  iframe inside. */}
              <Link
                href={previewHref}
                aria-label={`Preview the ${template.name} template`}
                className="relative block overflow-hidden border-b-[3px] border-char"
              >
                <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-char/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="brut-sm flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-xs font-black uppercase tracking-tight text-char">
                    <Eye className="h-4 w-4" />
                    preview
                  </span>
                </span>
                <TemplateThumb
                  src={`/preview/card/${template.id}?accent=${encodeURIComponent(template.preview)}&raw=1`}
                  title={`${template.name} template preview`}
                  aspect={THUMB_ASPECT}
                  top={thumbTop(template.id)}
                  tone={template.tone}
                />
              </Link>

              <div className="flex flex-1 flex-col gap-2.5 p-3">
                <h3 className="display truncate text-[24px] text-char sm:text-[26px]">{template.name}</h3>
                <div className="mt-auto flex gap-2">
                  <Link
                    href={previewHref}
                    aria-label={`Preview ${template.name}`}
                    className="hidden h-10 w-10 shrink-0 items-center sm:inline-flex justify-center rounded-full border-[3px] border-char bg-cream text-char transition-colors hover:bg-sun-soft"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/templates/${template.id}/edit${editQuery}`}
                    className="brut-sm brut-press inline-flex h-10 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-sun px-3 text-xs font-black uppercase tracking-tight text-char"
                  >
                    use this
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="mt-16 text-center text-sm font-bold text-char/60">
          Nothing in this category yet.
        </p>
      )}
    </div>
  );
}

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-3.5 text-[12px] font-black uppercase tracking-tight transition-colors sm:min-h-9 ${
        active ? "bg-char text-cream" : "text-char/50 hover:text-char"
      }`}
    >
      {label}
    </button>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`brut-sm inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-black uppercase tracking-tight transition-transform hover:-translate-y-0.5 ${
        active ? "bg-char text-sun" : "bg-white text-char"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-sun text-char" : "bg-cream text-char/70"}`}
      >
        {count}
      </span>
    </button>
  );
}
