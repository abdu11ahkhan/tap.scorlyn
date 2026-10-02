"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, Loader2, Send } from "lucide-react";
import { requestActivation } from "../actions";

/**
 * Activation code → claimed on the spot. No code → a request an admin
 * approves. `codeOnly` is for when a request is already waiting and the
 * code is the only thing left that changes anything.
 */
export default function RequestForm({ code, codeOnly = false }: { code: string; codeOnly?: boolean }) {
  const router = useRouter();
  const [activation, setActivation] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const hasCode = activation.replace(/[^a-z0-9]/gi, "").length > 0;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (codeOnly && !hasCode) {
          setError("Enter the code printed on the packaging.");
          return;
        }
        setError(null);
        start(async () => {
          const r = await requestActivation(code, activation);
          if (!r.ok) setError(r.error ?? "Something went wrong.");
          else router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">
          activation code {codeOnly ? "" : "(optional)"}
        </span>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-text-dimmer" />
          <input
            value={activation}
            onChange={(e) => setActivation(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            className="h-12 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 pl-11 pr-4 font-mono text-base font-bold tracking-widest text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-sc-gold"
          />
        </div>
        {!codeOnly && (
          <span className="mt-1.5 block text-xs font-medium text-sc-text-dimmer">
            Printed on the packaging. With it, your card activates instantly — without it, we approve it for you,
            usually within a few hours.
          </span>
        )}
      </label>

      {error && <p className="rounded-xl bg-sc-error/10 px-4 py-3 text-sm font-semibold text-sc-error">{error}</p>}

      <button type="submit" disabled={pending} className="app-btn app-btn-primary min-h-12 w-full justify-center">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : hasCode ? <KeyRound className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        {hasCode ? "Activate now" : "Request activation"}
      </button>
    </form>
  );
}
