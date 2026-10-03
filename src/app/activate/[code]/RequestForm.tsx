"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, KeyRound, Loader2, Send } from "lucide-react";
import { requestActivation } from "../actions";

/**
 * Activation code → claimed on the spot. That's the main path, so it's the
 * only thing shown at first; "Don't have your activation code?" opens the
 * request an admin approves. `codeOnly` is for when a request is already
 * waiting and the code is the only thing left that changes anything.
 */
export default function RequestForm({ code, codeOnly = false }: { code: string; codeOnly?: boolean }) {
  const router = useRouter();
  const [activation, setActivation] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [noCode, setNoCode] = useState(false);
  const hasCode = activation.replace(/[^a-z0-9]/gi, "").length > 0;

  const submit = (withCode: boolean) => {
    if (withCode && !hasCode) {
      setError("Enter the code printed on the packaging.");
      return;
    }
    setError(null);
    start(async () => {
      const r = await requestActivation(code, withCode ? activation : "");
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(true);
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">
            activation code
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
          <span className="mt-1.5 block text-xs font-medium text-sc-text-dimmer">Printed on the card&apos;s packaging.</span>
        </label>

        {error && <p className="rounded-xl bg-sc-error/10 px-4 py-3 text-sm font-semibold text-sc-error">{error}</p>}

        <button type="submit" disabled={pending} className="app-btn app-btn-primary min-h-12 w-full justify-center">
          {pending && !noCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Activate my card
        </button>
      </form>

      {!codeOnly && (
        <div className="rounded-xl border-2 border-sc-border-soft">
          <button
            type="button"
            onClick={() => setNoCode((v) => !v)}
            aria-expanded={noCode}
            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-bold text-sc-text-dim hover:text-sc-text"
          >
            Don&apos;t have your activation code?
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${noCode ? "rotate-180" : ""}`} />
          </button>
          {noCode && (
            <div className="space-y-3 border-t-2 border-sc-border-soft p-4">
              <p className="text-sm font-medium leading-relaxed text-sc-text-dim">
                Send a request instead. We check it and activate the card for you, usually within a few hours, and
                email you when it&apos;s ready.
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => submit(false)}
                className="app-btn app-btn-ghost min-h-12 w-full justify-center"
              >
                {pending && noCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Request activation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
