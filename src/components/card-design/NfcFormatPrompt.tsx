"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NfcCardArt, {
  CARD_FINISHES,
  DEFAULT_CARD_FIELDS,
  type CardFinish,
} from "@/components/card-design/NfcCardArt";
import type { CardProfile } from "@/lib/card";

/**
 * Asked once, the moment a card goes live: which physical card do you want?
 *
 * It runs here rather than at order time because the answer is useful before
 * anyone has paid — it tells us what to print, and it lets someone see their
 * own design on a real card while they are still excited about it. Choosing
 * is not a commitment to buy, so there is a way out that isn't a purchase.
 */
export default function NfcFormatPrompt({
  card,
  cardId,
  onDone,
}: {
  card: CardProfile;
  cardId: string;
  onDone: (finish: CardFinish | null) => void;
}) {
  const [picked, setPicked] = useState<CardFinish>(
    (card.template as CardFinish) && CARD_FINISHES.some((f) => f.id === card.template)
      ? (card.template as CardFinish)
      : "minimal"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileUrl =
    typeof window === "undefined"
      ? `https://tap.scorlyn.com/u/${card.username}`
      : `${window.location.origin}/u/${card.username}`;

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: saveError } = await createClient()
      .from("card_profiles")
      .update({
        nfc_finish: picked,
        nfc_fields: DEFAULT_CARD_FIELDS,
        nfc_chosen_at: new Date().toISOString(),
      })
      .eq("id", cardId);

    setSaving(false);
    if (saveError) {
      // Never close on failure: silently losing the choice is worse than
      // asking again, because nobody would know it hadn't been saved.
      setError(saveError.message);
      return;
    }
    onDone(picked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border-2 border-ink bg-[#0B0B0B] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
              Your card is live. Which NFC card do you want?
            </h2>
            <p className="mt-1 text-sm font-semibold text-white/45">
              We save this to your profile so it is ready to print whenever you
              order. You can change it any time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDone(null)}
            aria-label="Decide later"
            className="shrink-0 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
          {CARD_FINISHES.map((f) => {
            const active = picked === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setPicked(f.id)}
                aria-pressed={active}
                className={`group relative rounded-2xl border-2 p-3 text-left transition-colors ${
                  active
                    ? "border-acid bg-acid/10"
                    : "border-white/12 hover:border-white/30"
                }`}
              >
                {/* The real art, not a thumbnail of it: what they pick is
                    exactly what the printer receives. */}
                <NfcCardArt
                  card={card}
                  finish={f.id}
                  profileUrl={profileUrl}
                  width={300}
                />
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{f.name}</p>
                    <p className="truncate text-xs font-semibold text-white/40">
                      {f.blurb}
                    </p>
                  </div>
                  {active && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-acid">
                      <Check className="h-4 w-4 text-ink" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="px-5 pb-2 text-sm font-bold text-rose-300 sm:px-6">
            Could not save that: {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onDone(null)}
            className="text-sm font-bold text-white/50 transition-colors hover:text-white"
          >
            Decide later
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid px-7 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save my card design
          </button>
        </div>
      </div>
    </div>
  );
}
