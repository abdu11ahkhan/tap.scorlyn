"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { requestActivation } from "../actions";

/**
 * One tap sends the activation request; ScorlynTap approves it from
 * Admin → Card requests and the customer gets an email.
 */
export default function ClaimButton({ code, secondary = false }: { code: string; secondary?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-sc-error/10 px-4 py-3 text-sm font-semibold text-sc-error">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await requestActivation(code, "");
            if (!r.ok) setError(r.error ?? "Something went wrong.");
            else router.refresh();
          });
        }}
        className={`app-btn ${secondary ? "app-btn-ghost min-h-12" : "app-btn-primary min-h-14 text-base"} w-full justify-center`}
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Request activation
      </button>
    </div>
  );
}
