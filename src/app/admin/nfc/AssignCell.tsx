"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { assignNfcCard } from "../actions";

/** Assign a physical card to a handle, or clear it to return it to stock. */
export default function AssignCell({
  cardId,
  current,
}: {
  cardId: string;
  current: string | null;
}) {
  const [value, setValue] = useState(current ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="handle"
          className="h-9 w-32 rounded-lg border-2 border-white/15 bg-white/[0.04] px-3 text-xs font-bold text-white outline-none placeholder:text-white/25 focus:border-acid"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const r = await assignNfcCard(cardId, value);
              if (!r.ok) setError(r.error ?? "Failed.");
              else setSaved(true);
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 px-3 py-2 text-xs font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : saved ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : null}
          {value.trim() ? "assign" : "unassign"}
        </button>
      </div>
      {error && <span className="max-w-[200px] text-[11px] font-bold text-hotpink">{error}</span>}
    </div>
  );
}
