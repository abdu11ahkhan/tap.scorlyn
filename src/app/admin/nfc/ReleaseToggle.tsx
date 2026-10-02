"use client";

import { useState, useTransition } from "react";
import { Loader2, Tag } from "lucide-react";
import { setCardsClaimable } from "./actions";

const BTN =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-xs font-black lowercase transition-colors disabled:opacity-50";

/**
 * Releases stock for sale (so a customer who scans it can activate it) or
 * pulls it back. One card on its page; every in-stock card in a list.
 */
export default function ReleaseToggle({
  cardIds,
  released,
  label,
}: {
  cardIds: string[];
  /** Current state for a single card; omit for a bulk button pair. */
  released?: boolean;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState(released);
  const [note, setNote] = useState<string | null>(null);

  const apply = (claimable: boolean) =>
    start(async () => {
      setNote(null);
      const r = await setCardsClaimable(cardIds, claimable);
      if (!r.ok) setNote(r.error ?? "Could not update.");
      else {
        setState(claimable);
        if (released === undefined) setNote(`${r.data?.count ?? 0} card${r.data?.count === 1 ? "" : "s"} ${claimable ? "ready to sell" : "held back"}.`);
      }
    });

  if (released !== undefined) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => apply(!state)}
          className={`${BTN} ${state ? "border-acid bg-acid/10 text-acid" : "border-sc-border text-sc-text hover:border-acid hover:text-acid"}`}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
          {state ? "ready to sell — on" : "ready to sell — off"}
        </button>
        {note && <p className="text-xs font-bold text-hotpink">{note}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending || !cardIds.length} onClick={() => apply(true)} className={`${BTN} border-sc-border text-sc-text hover:border-acid hover:text-acid`}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />} {label ?? "mark ready to sell"}
      </button>
      <button type="button" disabled={pending || !cardIds.length} onClick={() => apply(false)} className={`${BTN} border-sc-border text-sc-text-dim hover:border-hotpink hover:text-hotpink`}>
        hold back
      </button>
      {note && <span className="text-xs font-bold text-acid">{note}</span>}
    </div>
  );
}
