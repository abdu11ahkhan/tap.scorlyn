"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import TemplateThumb from "./TemplateThumb";
import { SRC_H, SRC_W } from "./thumb-geometry";
import { thumbTop } from "./thumb-frames";

const THUMB_ASPECT = SRC_H / SRC_W;

type GalleryTemplate = {
  id: string;
  name: string;
  category: string;
  preview: string;
};

type GalleryCategory = { id: string; name: string; blurb?: string };

/**
 * linktr.ee/s/templates' format: one pill row filters a single flat grid in
 * place — pick a category and the grid swaps instantly, no navigation, no
 * per-category scroll. That instant swap is the whole point of the format,
 * which is what makes this a client component rather than the old page's
 * server-rendered anchor links into one section per category.
 */
export default function TemplateGallery({
  templates,
  categories,
  purposeId,
}: {
  templates: GalleryTemplate[];
  categories: readonly GalleryCategory[];
  purposeId: string | null;
}) {
  const [active, setActive] = useState<string>("all");

  const visible = useMemo(
    () => (active === "all" ? templates : templates.filter((t) => t.category === active)),
    [templates, active]
  );

  const purposeQuery = purposeId ? `&purpose=${encodeURIComponent(purposeId)}` : "";

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter templates by category"
      >
        <FilterPill label="all" active={active === "all"} onClick={() => setActive("all")} />
        {categories.map((category) => (
          <FilterPill
            key={category.id}
            label={category.name}
            active={active === category.id}
            onClick={() => setActive(category.id)}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 xl:grid-cols-5">
        {visible.map((template) => {
          const previewHref = `/preview/card/${template.id}?accent=${encodeURIComponent(template.preview)}${purposeQuery}`;

          return (
            <Link
              key={template.id}
              href={previewHref}
              aria-label={`View the ${template.name} template`}
              className="card-rise group flex min-w-0 flex-col"
            >
              {/* No frame/mat around the thumbnail — edge-to-edge, the way
                  linktr.ee's own cards read, rather than the old bezelled
                  tile. The lift is transform-only, so it never resamples the
                  iframe inside. */}
              <div className="sticker relative overflow-hidden rounded-[1.4rem] transition-transform duration-300 group-hover:-translate-y-1.5">
                <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-ink/70 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                  <span className="sticker flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-4 py-2 text-xs font-black uppercase tracking-tight text-ink">
                    <Eye className="h-4 w-4" />
                    view
                  </span>
                </span>

                <TemplateThumb
                  src={`/preview/card/${template.id}?accent=${encodeURIComponent(template.preview)}&raw=1`}
                  title={`${template.name} template preview`}
                  aspect={THUMB_ASPECT}
                  top={thumbTop(template.id)}
                />
              </div>

              <h3 className="mt-3 truncate px-0.5 text-center text-sm font-black lowercase tracking-tight text-ink transition-colors group-hover:text-teal sm:text-base">
                {template.name}
              </h3>
            </Link>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="mt-16 text-center text-sm font-bold text-ink-dim">
          Nothing in this category yet.
        </p>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "sticker inline-flex h-10 items-center rounded-full border-2 border-ink bg-ink px-4 text-sm font-black lowercase tracking-tight text-paper"
          : "inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-black lowercase tracking-tight text-ink-dim transition-colors hover:border-teal hover:text-teal"
      }
    >
      {label}
    </button>
  );
}
