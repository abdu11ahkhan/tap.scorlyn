"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";
import TemplateSwatch from "./TemplateSwatch";
import TemplateThumb from "@/app/templates/TemplateThumb";
import { SRC_H, SRC_W } from "@/app/templates/thumb-geometry";
import { thumbTop } from "@/app/templates/thumb-frames";

const THUMB_ASPECT = SRC_H / SRC_W;

/**
 * Compact template control.
 *
 * A flat grid of every template dominated the editor — twenty-one swatches
 * above the fields you actually came to fill in, repeating what the templates
 * page already shows. It now collapses to the current choice and opens on
 * demand, grouped by sector so the list is scannable.
 */
export default function TemplatePicker({
  value,
  accent,
  onChange,
  surface,
  font,
}: {
  value: string;
  accent: string;
  onChange: (templateId: string) => void;
  /** The background they picked, so every miniature shows it. */
  surface?: string;
  /** The font they picked, so a switch to another template previews in it too. */
  font?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = CARD_TEMPLATES.find((t) => t.id === value) ?? CARD_TEMPLATES[0];

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-black uppercase tracking-wide text-sc-text">
          Template
        </span>
        {open && (
          <span className="text-xs font-bold text-sc-text-dimmer">
            {CARD_TEMPLATES.length} to choose from
          </span>
        )}
      </div>

      {/* Current selection */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-sc-border bg-sc-surface-2 p-3 text-left transition-colors hover:border-sc-border-soft"
      >
        <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg border-2 border-sc-border">
          <TemplateSwatch id={current.id} accent={accent} surface={surface} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black lowercase leading-tight text-sc-text">
            {current.name}
          </p>
          <p className="truncate text-xs font-medium text-sc-text-dim">{current.blurb}</p>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-sc-border px-3 py-1.5 text-xs font-black lowercase text-sc-text-dim">
          {open ? "close" : "change"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-5 rounded-2xl border-2 border-sc-border-soft bg-sc-surface-2 p-4">
          <p className="text-xs font-semibold text-sc-text-dimmer">
            Only the look changes — your name, links, photos and everything
            else stay exactly as they are.
          </p>
          {TEMPLATE_CATEGORIES.map((category) => {
            const inCategory = CARD_TEMPLATES.filter((t) => t.category === category.id);
            if (inCategory.length === 0) return null;

            return (
              <div key={category.id}>
                <p className="mb-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
                  {category.name}
                </p>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                  {inCategory.map((template) => {
                    const isActive = template.id === value;
                    const previewSrc = `/preview/card/${template.id}?accent=${encodeURIComponent(accent)}${
                      font ? `&font=${encodeURIComponent(font)}` : ""
                    }&raw=1`;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        title={template.blurb}
                        onClick={() => {
                          onChange(template.id);
                          setOpen(false);
                        }}
                        className={`overflow-hidden rounded-xl border-2 bg-black text-left transition-all hover:-translate-y-0.5 ${
                          isActive ? "border-sc-gold" : "border-sc-border hover:border-sc-gold/50"
                        }`}
                      >
                        {/* The real template, rendered exactly like the public
                            gallery's thumbnails — not the abstract swatch, which
                            only ever showed a stand-in shape and colour rather
                            than what the layout actually looks like. */}
                        <TemplateThumb
                          src={previewSrc}
                          title={`${template.name} template preview`}
                          aspect={THUMB_ASPECT}
                          top={thumbTop(template.id)}
                        />
                        <div
                          className={`flex items-center justify-between gap-1 px-2 py-1.5 ${
                            isActive ? "bg-sc-gold" : "bg-sc-surface-2"
                          }`}
                        >
                          <span
                            className={`truncate text-[11px] font-black lowercase ${
                              isActive ? "text-sc-gold-ink" : "text-sc-text"
                            }`}
                          >
                            {template.name}
                          </span>
                          {isActive && (
                            <Check className="h-3 w-3 shrink-0 text-sc-gold-ink" strokeWidth={3.5} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
