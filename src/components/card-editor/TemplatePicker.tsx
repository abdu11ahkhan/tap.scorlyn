"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";
import TemplateSwatch from "./TemplateSwatch";

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
}: {
  value: string;
  accent: string;
  onChange: (templateId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = CARD_TEMPLATES.find((t) => t.id === value) ?? CARD_TEMPLATES[0];

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-black uppercase tracking-wide text-white">
          Template
        </span>
        {open && (
          <span className="text-xs font-bold text-white/35">
            {CARD_TEMPLATES.length} to choose from
          </span>
        )}
      </div>

      {/* Current selection */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-white/15 bg-white/[0.04] p-3 text-left transition-colors hover:border-white/35"
      >
        <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg border-2 border-white/15">
          <TemplateSwatch id={current.id} accent={accent} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-lg font-black lowercase leading-tight text-white">
            {current.name}
          </p>
          <p className="truncate text-xs font-medium text-white/45">{current.blurb}</p>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-white/20 px-3 py-1.5 text-xs font-black lowercase text-white/70">
          {open ? "close" : "change"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-5 rounded-2xl border-2 border-white/12 bg-white/[0.02] p-4">
          {TEMPLATE_CATEGORIES.map((category) => {
            const inCategory = CARD_TEMPLATES.filter((t) => t.category === category.id);
            if (inCategory.length === 0) return null;

            return (
              <div key={category.id}>
                <p className="mb-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
                  {category.name}
                </p>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                  {inCategory.map((template) => {
                    const isActive = template.id === value;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        title={template.blurb}
                        onClick={() => {
                          onChange(template.id);
                          setOpen(false);
                        }}
                        className={`overflow-hidden rounded-xl border-2 text-left transition-all hover:-translate-y-0.5 ${
                          isActive ? "border-acid" : "border-white/15 hover:border-white/40"
                        }`}
                      >
                        <div className="aspect-[3/4]">
                          <TemplateSwatch id={template.id} accent={accent} />
                        </div>
                        <div
                          className={`flex items-center justify-between gap-1 px-2 py-1.5 ${
                            isActive ? "bg-acid" : "bg-white/[0.05]"
                          }`}
                        >
                          <span
                            className={`truncate text-[11px] font-black lowercase ${
                              isActive ? "text-ink" : "text-white"
                            }`}
                          >
                            {template.name}
                          </span>
                          {isActive && (
                            <Check className="h-3 w-3 shrink-0 text-ink" strokeWidth={3.5} />
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
