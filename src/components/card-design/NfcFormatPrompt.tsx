"use client";

import { useState } from "react";
import { Check, FileUp, Loader2, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NfcCardArt, {
  CARD_FINISHES,
  DEFAULT_CARD_FIELDS,
  type CardFinish,
} from "@/components/card-design/NfcCardArt";
import { cardLinkUrl, type CardProfile } from "@/lib/card";

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
  /** A design the customer supplied themselves, instead of one of ours. */
  const [ownFile, setOwnFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const profileUrl = cardLinkUrl(
    card,
    typeof window === "undefined" ? "https://tap.scorlyn.com" : window.location.origin
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    let artwork: { nfc_artwork_path: string; nfc_artwork_name: string } | null = null;
    if (ownFile) {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUploading(false);
        setSaving(false);
        setError("Your session expired — sign in again and retry.");
        return;
      }
      // <user_id>/... is what the storage policies key off; any other shape
      // is rejected rather than silently landing somewhere unreadable.
      const safe = ownFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const path = `${user.id}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("nfc-artwork")
        .upload(path, ownFile, { upsert: false });
      setUploading(false);
      if (upErr) {
        setSaving(false);
        setError(`Could not upload that file: ${upErr.message}`);
        return;
      }
      artwork = { nfc_artwork_path: path, nfc_artwork_name: ownFile.name };
    }

    const { error: saveError } = await supabase
      .from("card_profiles")
      .update({
        nfc_finish: picked,
        nfc_fields: DEFAULT_CARD_FIELDS,
        nfc_chosen_at: new Date().toISOString(),
        ...(artwork ?? {}),
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
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border-2 border-sc-border bg-sc-bg sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-sc-border-soft p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-black tracking-tight text-sc-text sm:text-xl">
              Your card is live. Which NFC card do you want?
            </h2>
            <p className="mt-1 text-sm font-semibold text-sc-text-dim">
              We save this to your profile so it is ready to print whenever you
              order. You can change it any time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDone(null)}
            aria-label="Decide later"
            className="shrink-0 rounded-full p-2 text-sc-text-dimmer transition-colors hover:bg-sc-surface-2 hover:text-sc-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* Own artwork first: someone who already has a design should not
              have to scroll fifteen of ours to find out we accept it. */}
          <div className="mb-5 rounded-2xl border-2 border-dashed border-sc-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-sc-text">
                  Have your own design?
                </p>
                <p className="mt-0.5 text-xs font-semibold text-sc-text-dim">
                  Send us a print-ready file — PDF, PNG, JPG or SVG, up to
                  20&nbsp;MB. We print that instead.
                </p>
              </div>
              {ownFile ? (
                <div className="flex items-center gap-2">
                  <span className="max-w-[14rem] truncate rounded-full bg-sc-gold/15 px-3 py-1.5 text-xs font-bold text-sc-gold-text">
                    {ownFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOwnFile(null)}
                    aria-label="Remove file"
                    className="rounded-full p-2 text-sc-text-dimmer transition-colors hover:bg-sc-surface-2 hover:text-sc-text"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-sc-gold hover:text-sc-gold-text">
                  <FileUp className="h-4 w-4" />
                  Upload file
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.svg,image/*,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // Checked here as well as in the bucket: a 40MB file
                      // otherwise uploads for a minute before being refused.
                      if (file.size > 20 * 1024 * 1024) {
                        setError("That file is over 20 MB — send a smaller one.");
                        return;
                      }
                      setError(null);
                      setOwnFile(file);
                    }}
                  />
                </label>
              )}
            </div>
            {ownFile && (
              <p className="mt-3 text-xs font-semibold text-sc-text-dim">
                We will print your file. Still pick a finish below — it is what
                we fall back to if there is a problem with the artwork.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
                    ? "border-sc-gold bg-sc-gold/10"
                    : "border-sc-border-soft hover:border-sc-border"
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
                    <p className="truncate text-sm font-black text-sc-text">{f.name}</p>
                    <p className="truncate text-xs font-semibold text-sc-text-dimmer">
                      {f.blurb}
                    </p>
                  </div>
                  {active && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sc-gold">
                      <Check className="h-4 w-4 text-sc-gold-ink" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        </div>

        {error && (
          <p className="px-5 pb-2 text-sm font-bold text-sc-error sm:px-6">
            Could not save that: {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-sc-border-soft p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onDone(null)}
            className="text-sm font-bold text-sc-text-dim transition-colors hover:text-sc-text"
          >
            Decide later
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-sc-gold bg-sc-gold px-7 text-sm font-black uppercase tracking-tight text-sc-gold-ink disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Uploading…" : "Save my card design"}
          </button>
        </div>
      </div>
    </div>
  );
}
