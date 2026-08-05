"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

type Result = { ok: boolean; error?: string };

/**
 * One button for every admin mutation.
 *
 * Server Actions can fail on the RLS policy rather than the page check, and a
 * silent no-op is the worst outcome in a console — you'd think you'd banned
 * someone who is still live. This surfaces whatever came back.
 */
export default function ActionButton({
  action,
  children,
  confirm,
  variant = "ghost",
  className = "",
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  confirm?: string;
  variant?: "ghost" | "acid" | "danger";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const styles = {
    ghost:
      "border-white/20 text-white/70 hover:border-acid hover:text-acid",
    acid: "border-ink bg-acid text-ink",
    danger: "border-white/20 text-white/70 hover:border-hotpink hover:text-hotpink",
  }[variant];

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (!result.ok) setError(result.error ?? "Something went wrong.");
          });
        }}
        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-xs font-black lowercase transition-colors disabled:opacity-50 ${styles} ${className}`}
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        {children}
      </button>
      {error && (
        <span className="max-w-[220px] text-[11px] font-bold text-hotpink">{error}</span>
      )}
    </span>
  );
}
