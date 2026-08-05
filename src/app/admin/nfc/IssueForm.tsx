"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { issueNfcCards } from "../actions";

/** Pre-issue blank stock so cards can be printed before they're sold. */
export default function IssueForm() {
  const [count, setCount] = useState(10);
  const [batch, setBatch] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await issueNfcCards(count, batch);
          if (!r.ok) setError(r.error ?? "Failed.");
          else setBatch("");
        });
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl border-2 border-white/12 bg-white/[0.03] p-5"
    >
      <div>
        <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-white/40">
          how many
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="h-12 w-28 rounded-xl border-2 border-white/15 bg-white/[0.04] px-4 font-bold text-white outline-none focus:border-acid"
        />
      </div>

      <div className="min-w-[180px] flex-1">
        <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-white/40">
          batch label (optional)
        </label>
        <input
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          placeholder="e.g. Aug-2026 matte black"
          className="h-12 w-full rounded-xl border-2 border-white/15 bg-white/[0.04] px-4 font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="sticker sticker-press flex h-12 items-center gap-2 rounded-full border-2 border-ink bg-acid px-6 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        issue cards
      </button>

      {error && (
        <p className="w-full text-sm font-bold text-hotpink">{error}</p>
      )}
    </form>
  );
}
