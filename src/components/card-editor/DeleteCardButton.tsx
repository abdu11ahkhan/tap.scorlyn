"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Deletes this card and frees its handle.
 *
 * Behind typing the handle rather than a confirm dialog: the card is the whole
 * of someone's work here, the handle goes back into circulation for anyone
 * else to claim, and a dialog on a page of other buttons gets dismissed by
 * reflex.
 *
 * Orders are untouched — they reference the card by id and keep their own copy
 * of the artwork, so a delivered card's paperwork survives the page going.
 */
export default function DeleteCardButton({
  cardId,
  username,
  onDeleted,
}: {
  cardId: string;
  username: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expected = username.trim().toLowerCase();
  const ready = typed.trim().toLowerCase() === expected && expected.length > 0;

  const remove = async () => {
    setBusy(true);
    setError(null);

    const { error: deleteError } = await createClient()
      .from("card_profiles")
      .delete()
      .eq("id", cardId);

    if (deleteError) {
      setError(deleteError.message);
      setBusy(false);
      return;
    }

    setOpen(false);
    setBusy(false);
    onDeleted();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-ink/40 transition-colors hover:text-hotpink"
      >
        <Trash2 className="h-3.5 w-3.5" />
        delete this card
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-hotpink/40 bg-hotpink/5 p-4">
      <p className="text-sm font-black text-ink">Delete this card?</p>
      <p className="mt-1 text-xs font-semibold text-ink/60">
        Your page at /u/{expected} stops working and the handle becomes
        available to someone else. Any NFC card you own will point at nothing
        until you make a new one. Your orders are kept.
      </p>

      <label className="mt-3 block text-xs font-bold uppercase tracking-widest text-ink/50">
        Type <span className="text-hotpink">{expected}</span> to confirm
      </label>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="mt-1.5 h-11 w-full rounded-lg border-2 border-ink bg-white px-3 font-semibold text-ink outline-none"
      />

      {error && <p className="mt-2 text-xs font-bold text-hotpink">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={remove}
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink bg-hotpink px-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          delete
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError(null);
          }}
          className="inline-flex h-10 items-center rounded-full px-4 text-xs font-black uppercase tracking-widest text-ink/50"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
