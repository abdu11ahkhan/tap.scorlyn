"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { TEMPLATE_CATEGORIES } from "@/lib/card";
import { saveTemplateSettings } from "../actions";

export default function TemplateRow({
  templateId,
  defaults,
  settings,
}: {
  templateId: string;
  defaults: { name: string; blurb: string; category: string };
  settings: {
    enabled: boolean;
    name: string | null;
    blurb: string | null;
    category: string | null;
    sort_order: number;
    is_new: boolean;
  } | null;
}) {
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);
  const [name, setName] = useState(settings?.name ?? "");
  const [blurb, setBlurb] = useState(settings?.blurb ?? "");
  const [category, setCategory] = useState(settings?.category ?? defaults.category);
  const [sortOrder, setSortOrder] = useState(settings?.sort_order ?? 0);
  const [isNew, setIsNew] = useState(settings?.is_new ?? false);

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await saveTemplateSettings({
        templateId,
        enabled,
        name,
        blurb,
        category,
        sortOrder,
        isNew,
      });
      if (!r.ok) setError(r.error ?? "Failed.");
      else setSaved(true);
    });
  };

  const field =
    "h-10 rounded-lg border-2 border-white/15 bg-white/[0.04] px-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid";

  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-colors ${
        enabled ? "border-white/12 bg-white/[0.03]" : "border-white/8 bg-white/[0.01] opacity-60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[130px] flex-1">
          <p className="text-lg font-black lowercase">{defaults.name}</p>
          <p className="font-mono text-[11px] text-white/35">{templateId}</p>
        </div>

        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`rounded-full border-2 px-4 py-2 text-xs font-black lowercase transition-colors ${
            enabled
              ? "border-ink bg-acid text-ink"
              : "border-white/20 text-white/50 hover:text-white"
          }`}
        >
          {enabled ? "live" : "hidden"}
        </button>

        <button
          type="button"
          onClick={() => setIsNew((v) => !v)}
          className={`rounded-full border-2 px-4 py-2 text-xs font-black lowercase transition-colors ${
            isNew
              ? "border-ink bg-hotpink text-white"
              : "border-white/20 text-white/50 hover:text-white"
          }`}
        >
          new badge
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_140px_90px]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaults.name}
          className={field}
          aria-label="Display name override"
        />
        <input
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder={defaults.blurb}
          className={field}
          aria-label="Blurb override"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${field} bg-ink`}
          aria-label="Sector"
        >
          {TEMPLATE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className={field}
          aria-label="Sort order"
          title="Lower sorts first"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-acid px-4 py-2 text-xs font-black lowercase text-ink disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : saved ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : null}
          {saved ? "saved" : "save"}
        </button>
        <span className="text-[11px] font-semibold text-white/30">
          Blank fields fall back to the built-in wording.
        </span>
        {error && <span className="text-[11px] font-bold text-hotpink">{error}</span>}
      </div>
    </div>
  );
}
