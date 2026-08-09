"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import NfcCardArt, {
  CARD_FINISHES,
  type CardFinish,
} from "@/components/card-design/NfcCardArt";
import type { CardProfile } from "@/lib/card";

/**
 * Choosing the printed card on a customer's behalf.
 *
 * Most orders here arrive over WhatsApp from someone who never opened the
 * picker, so without this there is nothing to print and the order stalls on a
 * question nobody asked. Same fifteen designs the customer sees, drawn with
 * their own details, so what is chosen here is what comes off the printer.
 */
export default function FinishPicker({
  card,
  current,
  profileUrl,
  onSave,
}: {
  card: CardProfile;
  current: string | null;
  profileUrl: string;
  onSave: (finish: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [picked, setPicked] = useState<string | null>(current);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const choose = (finish: CardFinish) => {
    setPicked(finish);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await onSave(finish);
      if (result.ok) {
        setSaved(true);
      } else {
        // Put the selection back: leaving the new one highlighted after a
        // failed save is how someone concludes it was set when it wasn't.
        setPicked(current);
        setError(result.error ?? "Could not save that design.");
      }
    });
  };

  return (
    <div className="app-panel app-panel-pad print:hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">
            Choose the card for this customer
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/45">
            Saves to their profile straight away — same as if they had picked
            it themselves.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          {pending && (
            <span className="flex items-center gap-1.5 text-white/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              saving
            </span>
          )}
          {saved && !pending && <span className="text-acid">saved</span>}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border-2 border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm font-bold text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_FINISHES.map((f) => {
          const active = picked === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => choose(f.id)}
              disabled={pending}
              aria-pressed={active}
              className={`rounded-2xl border-2 p-2.5 text-left transition-colors disabled:opacity-60 ${
                active ? "border-acid bg-acid/10" : "border-white/12 hover:border-white/30"
              }`}
            >
              <NfcCardArt
                card={card}
                finish={f.id}
                profileUrl={profileUrl}
                width={240}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-black lowercase text-white">
                  {f.name}
                </span>
                {active && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-acid">
                    <Check className="h-3 w-3 text-ink" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
