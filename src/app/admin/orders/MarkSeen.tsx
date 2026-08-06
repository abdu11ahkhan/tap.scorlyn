"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Check, Loader2 } from "lucide-react";
import { markOrdersSeen } from "../actions";

/**
 * The new-order banner, and the only way to clear it.
 *
 * This used to clear itself the moment the page mounted, which meant the
 * signal disappeared before it had been read — and if the orders list was the
 * first page opened, the badge never appeared at all. Clearing is an explicit
 * act now.
 */
export default function MarkSeen({ unseen }: { unseen: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (unseen < 1) return null;

  return (
    <div className="app-panel app-panel-pad mb-4 flex flex-wrap items-center gap-3 border-hotpink/40">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hotpink">
        <BellRing className="h-4 w-4 text-white" />
      </span>

      <p className="min-w-0 flex-1 text-[13px] font-semibold">
        {unseen} new {unseen === 1 ? "order" : "orders"} since you last checked.
        {error && <span className="ml-2 text-hotpink">{error}</span>}
      </p>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await markOrdersSeen();
            if (!r.ok) setError(r.error ?? "Could not clear.");
            else router.refresh();
          });
        }}
        className="app-btn app-btn-ghost shrink-0 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        mark all read
      </button>
    </div>
  );
}
