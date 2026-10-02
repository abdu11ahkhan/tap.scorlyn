"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { decideClaim } from "./actions";

export default function DecideButtons({ claimId, who }: { claimId: string; who: string }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = (approve: boolean) => {
    if (!approve && !window.confirm(`Reject ${who}'s request? They'll be emailed that it wasn't approved.`)) return;
    setError(null);
    setBusy(approve ? "yes" : "no");
    start(async () => {
      const r = await decideClaim(claimId, approve, note);
      setBusy(null);
      if (!r.ok) setError(r.error ?? "Something went wrong.");
    });
  };

  return (
    <div className="space-y-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        placeholder="Note to the customer (optional)"
        className="h-11 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-3.5 text-sm font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-acid"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(true)}
          className="sticker sticker-press inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 text-xs font-black uppercase tracking-tight text-ink disabled:opacity-60"
        >
          {busy === "yes" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(false)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-sc-border px-5 text-xs font-black lowercase text-sc-text hover:border-hotpink hover:text-hotpink disabled:opacity-60"
        >
          {busy === "no" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} reject
        </button>
      </div>
      {error && <p className="text-xs font-bold text-hotpink">{error}</p>}
    </div>
  );
}
